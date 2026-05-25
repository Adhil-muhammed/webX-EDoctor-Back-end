import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createNotificationServiceModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createNotificationServiceModule());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3005);

  await app.listen(port);
}

void bootstrap();
