import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class BookingServiceHealthController {
  @Get()
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/booking-service',
      status: 'ok',
    };
  }
}
