import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class ApiGatewayHealthController {
  @Get()
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/api-gateway',
      status: 'ok',
    };
  }
}
