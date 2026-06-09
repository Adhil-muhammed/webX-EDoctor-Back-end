import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createNotificationServiceModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createNotificationServiceModule());
  const config = app.get(ConfigService);

  // Raw KafkaJS consumers (NotificationKafkaConsumer, DltKafkaConsumer) connect
  // and subscribe in their OnModuleInit lifecycle hooks — no connectMicroservice needed.
  await app.listen(config.get<number>('PORT', 3005));
}

void bootstrap();
