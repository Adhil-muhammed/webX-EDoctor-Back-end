import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createAuthServiceModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createAuthServiceModule());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);
}

void bootstrap();
