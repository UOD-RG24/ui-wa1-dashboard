import { Injectable, Logger } from '@nestjs/common';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';

const DEFAULT_CORE_API_URL =
  'https://rg24-rg1-wa1-api-bchpdqcthyh3ddd2.ukwest-01.azurewebsites.net';

export type CoreApiInit = {
  method?: string;
  authorization?: string | null;
  contentType?: string | null;
  body?: BodyInit | null;
  /** Required when body is a Node stream (e.g. multipart proxy). */
  duplex?: 'half';
};

@Injectable()
export class CoreApiService {
  private readonly logger = new Logger(CoreApiService.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (
      process.env.CORE_API_URL ?? DEFAULT_CORE_API_URL
    ).replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  buildUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  async fetch(path: string, init: CoreApiInit = {}): Promise<Response> {
    const headers = new Headers();
    if (init.authorization) {
      headers.set('Authorization', init.authorization);
    }
    if (init.contentType) {
      headers.set('Content-Type', init.contentType);
    }

    const requestInit: RequestInit & { duplex?: 'half' } = {
      method: init.method ?? 'GET',
      headers,
      body: init.body ?? undefined,
    };
    if (init.duplex) {
      requestInit.duplex = init.duplex;
    }

    const url = this.buildUrl(path);
    this.logger.debug(`${requestInit.method} ${url}`);
    return globalThis.fetch(url, requestInit);
  }

  async fetchJson<T = unknown>(path: string, init: CoreApiInit = {}): Promise<{
    status: number;
    ok: boolean;
    data: T | null;
    rawText: string;
  }> {
    const response = await this.fetch(path, init);
    const rawText = await response.text();
    let data: T | null = null;
    if (rawText) {
      try {
        data = JSON.parse(rawText) as T;
      } catch {
        data = null;
      }
    }
    return {
      status: response.status,
      ok: response.ok,
      data,
      rawText,
    };
  }

  /**
   * Pipe an upstream Response to an Express/Nest ServerResponse.
   */
  async pipeTo(res: ServerResponse, upstream: Response): Promise<void> {
    res.statusCode = upstream.status;

    const hopByHop = new Set([
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade',
      'content-encoding',
    ]);

    upstream.headers.forEach((value, key) => {
      if (!hopByHop.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.end(buffer);
  }

  /**
   * Forward the incoming request body stream (e.g. multipart upload).
   * Uses raw HTTP piping — Node fetch + duplex is unreliable for large bodies.
   */
  async proxyRaw(
    path: string,
    req: IncomingMessage,
    res: ServerResponse,
    method: string,
  ): Promise<void> {
    const target = new URL(this.buildUrl(path));
    const requester = target.protocol === 'https:' ? httpsRequest : httpRequest;
    const hopByHop = new Set([
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade',
    ]);

    const headers: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && !hopByHop.has(key.toLowerCase())) {
        headers[key] = value;
      }
    }
    delete headers.host;

    const url = target.toString();
    this.logger.debug(`${method} ${url}`);

    await new Promise<void>((resolve, reject) => {
      const upstreamReq = requester(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port || (target.protocol === 'https:' ? 443 : 80),
          path: `${target.pathname}${target.search}`,
          method,
          headers,
        },
        (upstreamRes) => {
          res.statusCode = upstreamRes.statusCode ?? 502;
          for (const [key, value] of Object.entries(upstreamRes.headers)) {
            if (value !== undefined && !hopByHop.has(key.toLowerCase())) {
              res.setHeader(key, value);
            }
          }
          upstreamRes.pipe(res);
          upstreamRes.on('end', () => resolve());
          upstreamRes.on('error', reject);
        },
      );

      upstreamReq.on('error', (err) => {
        this.logger.error(`proxyRaw upstream error: ${err.message}`);
        if (!res.headersSent) {
          res.statusCode = 502;
          res.end('Bad Gateway');
        }
        reject(err);
      });

      req.on('error', (err) => {
        upstreamReq.destroy();
        reject(err);
      });

      req.pipe(upstreamReq);
    });
  }

  authorizationFrom(header: string | string[] | undefined): string | null {
    if (!header) return null;
    return Array.isArray(header) ? (header[0] ?? null) : header;
  }
}
