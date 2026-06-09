import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createBookingServiceModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createBookingServiceModule());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3003);

  await app.listen(port);
}

void bootstrap();
