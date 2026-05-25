import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationServiceHealthController } from './entrypoints/http/notification-service.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NotificationServiceHealthController],
})
class NotificationServiceModule {}

export function createNotificationServiceModule(): typeof NotificationServiceModule {
  return NotificationServiceModule;
}
