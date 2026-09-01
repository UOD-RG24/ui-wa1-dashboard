import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CoreApiService } from '../core-api/core-api.service';

type MicrosoftStatus = {
  microsoftAuthenticated?: boolean;
  registered?: boolean;
  user?: unknown;
  message?: string;
};

type MicrosoftSignInResponse = {
  message?: string;
  accessToken?: string;
  user?: unknown;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly coreApi: CoreApiService) {}

  @Post('jwt/signup')
  async jwtSignUp(
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/auth/jwt/signup', {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify(body ?? {}),
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Post('jwt/signin')
  async jwtSignIn(
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/auth/jwt/signin', {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify(body ?? {}),
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Get('status')
  async status(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/auth/status', {
      method: 'GET',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Post('signout')
  async signOut(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/auth/signout', {
      method: 'POST',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Get('microsoft/status')
  async microsoftStatus(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/auth/microsoft/status', {
      method: 'GET',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Post('microsoft/signup')
  async microsoftSignUp(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/auth/microsoft/signup', {
      method: 'POST',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  @Post('microsoft/signin')
  async microsoftSignIn(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.coreApi.fetch('/auth/microsoft/signin', {
      method: 'POST',
      authorization: authorization ?? null,
    });
    await this.coreApi.pipeTo(res, upstream);
  }

  /**
   * BFF helper: Entra Bearer → ensure registered → LocalJwt accessToken.
   */
  @Post('microsoft/exchange')
  async microsoftExchange(
    @Headers('authorization') authorization: string | undefined,
    @Req() _req: Request,
  ): Promise<MicrosoftSignInResponse> {
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      throw new HttpException(
        { message: 'Microsoft access token is required.' },
        401,
      );
    }

    const statusResult = await this.coreApi.fetchJson<MicrosoftStatus>(
      '/auth/microsoft/status',
      { method: 'GET', authorization },
    );

    if (!statusResult.ok || !statusResult.data) {
      throw new HttpException(
        statusResult.data ?? { message: 'Microsoft authentication failed.' },
        statusResult.status || 401,
      );
    }

    if (!statusResult.data.registered) {
      const signupResult = await this.coreApi.fetchJson(
        '/auth/microsoft/signup',
        { method: 'POST', authorization },
      );

      // 409 = already registered — continue to sign-in.
      if (!signupResult.ok && signupResult.status !== 409) {
        throw new HttpException(
          signupResult.data ?? { message: 'Microsoft sign-up failed.' },
          signupResult.status || 400,
        );
      }
    }

    const signInResult = await this.coreApi.fetchJson<MicrosoftSignInResponse>(
      '/auth/microsoft/signin',
      { method: 'POST', authorization },
    );

    if (!signInResult.ok || !signInResult.data?.accessToken) {
      throw new HttpException(
        signInResult.data ?? { message: 'Microsoft sign-in failed.' },
        signInResult.status || 401,
      );
    }

    return signInResult.data;
  }
}
