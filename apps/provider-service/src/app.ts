import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProviderServiceHealthController } from './entrypoints/http/provider-service.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ProviderServiceHealthController],
})
class ProviderServiceModule {}

export function createProviderServiceModule(): typeof ProviderServiceModule {
  return ProviderServiceModule;
}
