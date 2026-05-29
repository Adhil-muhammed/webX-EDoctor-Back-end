import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createApiGatewayModule } from './app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createApiGatewayModule());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ente Doctor API')
    .setDescription('Unified API documentation — select a service from the dropdown.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      urls: [
        { url: 'http://localhost:3001/api-docs-json', name: 'Auth Service' },
      ],
    },
  });

  await app.listen(port);
}

void bootstrap();
