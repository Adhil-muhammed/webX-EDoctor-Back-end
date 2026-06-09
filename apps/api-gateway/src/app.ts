import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiGatewayHealthController } from './entrypoints/http/api-gateway.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ApiGatewayHealthController],
})
class ApiGatewayModule {}

export function createApiGatewayModule(): typeof ApiGatewayModule {
  return ApiGatewayModule;
}
