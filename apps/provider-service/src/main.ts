import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createProviderServiceModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createProviderServiceModule());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3002);

  await app.listen(port);
}

void bootstrap();
