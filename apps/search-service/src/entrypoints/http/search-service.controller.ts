import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class SearchServiceHealthController {
  @Get()
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/search-service',
      status: 'ok',
    };
  }
}
