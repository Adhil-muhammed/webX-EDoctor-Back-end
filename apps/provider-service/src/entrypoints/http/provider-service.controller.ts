import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class ProviderServiceHealthController {
  @Get()
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/provider-service',
      status: 'ok',
    };
  }
}
