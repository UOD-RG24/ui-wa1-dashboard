import { Controller, Get } from '@nestjs/common';
import { CoreApiService } from './core-api/core-api.service';

@Controller()
export class HealthController {
  constructor(private readonly coreApi: CoreApiService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'ui-wa1-dashboard-bff',
      coreApi: this.coreApi.getBaseUrl(),
    };
  }
}
