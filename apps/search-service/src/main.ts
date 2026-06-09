import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createSearchServiceModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createSearchServiceModule());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3004);

  await app.listen(port);
}

void bootstrap();
