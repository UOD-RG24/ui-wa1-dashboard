import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CoreApiModule } from './core-api/core-api.module';
import { DatasetsModule } from './datasets/datasets.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { HealthController } from './health.controller';

@Module({
  imports: [CoreApiModule, AuthModule, DatasetsModule, ExperimentsModule],
  controllers: [HealthController],
})
export class AppModule {}
