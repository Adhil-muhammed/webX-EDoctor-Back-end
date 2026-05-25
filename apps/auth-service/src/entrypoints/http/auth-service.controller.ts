import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AuthServiceHealthController {
  @Get()
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/auth-service',
      status: 'ok',
    };
  }
}
