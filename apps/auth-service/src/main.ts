import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createAuthServiceModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createAuthServiceModule());
  app.enableCors({ origin: 'http://localhost:3000' });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('OTP-based authentication API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port);
}

void bootstrap();
