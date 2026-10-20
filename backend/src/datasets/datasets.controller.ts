import {
  All,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CoreApiService } from '../core-api/core-api.service';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly coreApi: CoreApiService) {}

  @Post('create')
  async create(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.coreApi.proxyRaw('/datasets/create', req, res, 'POST');
  }

  @Get('get/list')
  async list(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/datasets/get/list', {
      method: 'GET',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Get('get/:id')
  async getOne(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(`/datasets/get/${id}`, {
      method: 'GET',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Put('update/:id')
  async update(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(`/datasets/update/${id}`, {
      method: 'PUT',
      authorization: authorization ?? null,
      contentType: 'application/json',
      body: JSON.stringify(req.body ?? {}),
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Get('download/:id')
  async download(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(`/datasets/download/${id}`, {
      method: 'GET',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Delete('delete/:id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(`/datasets/delete/${id}`, {
      method: 'DELETE',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  /** Catch-all for any additional dataset routes (e.g. future core endpoints). */
  @All('*path')
  async catchAll(@Req() req: Request, @Res() res: Response): Promise<void> {
    const suffix = req.path.replace(/^\/datasets/, '') || '/';
    const path = `/datasets${suffix}`;
    const method = req.method.toUpperCase();
    const contentType = req.headers['content-type'];

    if (
      contentType?.includes('multipart/form-data') ||
      (!req.body && method !== 'GET' && method !== 'HEAD' && method !== 'DELETE')
    ) {
      await this.coreApi.proxyRaw(path, req, res, method);
      return;
    }

    const upstream = await this.coreApi.fetch(path, {
      method,
      authorization: this.coreApi.authorizationFrom(req.headers.authorization),
      contentType:
        typeof contentType === 'string' && contentType.includes('application/json')
          ? 'application/json'
          : null,
      body:
        method === 'GET' || method === 'HEAD'
          ? null
          : JSON.stringify(req.body ?? {}),
    });
    await this.coreApi.pipeTo(res, upstream);
  }
}
