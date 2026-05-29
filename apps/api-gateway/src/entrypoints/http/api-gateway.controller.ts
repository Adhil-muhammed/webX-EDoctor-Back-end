import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class ApiGatewayHealthController {
  @Get()
  @ApiOperation({ summary: 'Gateway health check', description: 'Returns the live status of the api-gateway.' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy.', schema: { example: { service: '@ente-doctor/api-gateway', status: 'ok' } } })
  health(): { service: string; status: 'ok' } {
    return {
      service: '@ente-doctor/api-gateway',
      status: 'ok',
    };
  }
}
