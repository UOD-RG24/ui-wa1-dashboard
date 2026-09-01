import {
  All,
  Body,
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

@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly coreApi: CoreApiService) {}

  @Post('create')
  async create(
    @Body() body: unknown,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/experiments/create', {
      method: 'POST',
      authorization: authorization ?? null,
      contentType: 'application/json',
      body: JSON.stringify(body ?? {}),
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Get('get/list')
  async list(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/experiments/get/list', {
      method: 'GET',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Get('get/deleted')
  async listDeleted(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/experiments/get/deleted', {
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
    const upstream = await this.coreApi.fetch(`/experiments/get/${id}`, {
      method: 'GET',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Put('update/:id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(`/experiments/update/${id}`, {
      method: 'PUT',
      authorization: authorization ?? null,
      contentType: 'application/json',
      body: JSON.stringify(body ?? {}),
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Put('update/:id/:section')
  async updateSection(
    @Param('id') id: string,
    @Param('section') section: string,
    @Body() body: unknown,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(
      `/experiments/update/${id}/${section}`,
      {
        method: 'PUT',
        authorization: authorization ?? null,
        contentType: 'application/json',
        body: JSON.stringify(body ?? {}),
      },
    );
    await this.coreApi.pipeTo(res, upstream);
  }

  @Delete('delete/:id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(`/experiments/delete/${id}`, {
      method: 'DELETE',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Put('restore/:id')
  async restore(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch(`/experiments/restore/${id}`, {
      method: 'PUT',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Post('get/:id/blobs/upload')
  async uploadBlob(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.coreApi.proxyRaw(
      `/experiments/get/${req.params.id}/blobs/upload`,
      req,
      res,
      'POST',
    );
  }

  @All('*path')
  async catchAll(@Req() req: Request, @Res() res: Response): Promise<void> {
    const suffix = req.path.replace(/^\/experiments/, '') || '/';
    const path = `/experiments${suffix}`;
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
        method === 'GET' || method === 'HEAD' || method === 'DELETE'
          ? null
          : JSON.stringify(req.body ?? {}),
    });
    await this.coreApi.pipeTo(res, upstream);
  }
}
