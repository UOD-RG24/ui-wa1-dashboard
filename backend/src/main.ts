import { NestFactory } from '@nestjs/core';
import { config as loadEnv } from 'dotenv';
import { json, urlencoded } from 'express';
import { resolve } from 'path';
import { AppModule } from './app.module';

loadEnv({ path: resolve(__dirname, '..', '.env') });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Parse JSON for auth/experiments; leave multipart streams intact for dataset uploads.
  app.use(
    json({
      limit: '2mb',
      type: (req) => {
        const contentType = req.headers['content-type'] ?? '';
        return contentType.includes('application/json');
      },
    }),
  );
  app.use(
    urlencoded({
      extended: true,
      limit: '2mb',
      type: (req) => {
        const contentType = req.headers['content-type'] ?? '';
        return contentType.includes('application/x-www-form-urlencoded');
      },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);
  const server = await app.listen(port);
  // Large blob uploads (250MB+) can take many minutes browser → BFF → Azure.
  const uploadTimeoutMs = 60 * 60 * 1000;
  server.setTimeout(uploadTimeoutMs);
  if ('requestTimeout' in server) {
    server.requestTimeout = uploadTimeoutMs;
  }
}

bootstrap();
