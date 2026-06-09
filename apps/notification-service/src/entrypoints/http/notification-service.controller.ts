import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class NotificationServiceHealthController {
  @Get()
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/notification-service',
      status: 'ok',
    };
  }
}
