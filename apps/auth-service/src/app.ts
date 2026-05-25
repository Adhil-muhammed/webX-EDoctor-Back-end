import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthServiceHealthController } from './entrypoints/http/auth-service.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AuthServiceHealthController],
})
class AuthServiceModule {}

export function createAuthServiceModule(): typeof AuthServiceModule {
  return AuthServiceModule;
}
