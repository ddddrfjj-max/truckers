import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as path from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve uploaded files
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  app.use('/uploads', express.static(path.resolve(uploadDir)));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('FreightFlow API')
    .setDescription('Transportation marketplace REST API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Authentication')
    .addTag('users', 'User management')
    .addTag('shipments', 'Shipment management')
    .addTag('bids', 'Bidding system')
    .addTag('bookings', 'Booking management')
    .addTag('documents', 'Document uploads')
    .addTag('admin', 'Admin operations')
    .addTag('notifications', 'Notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 FreightFlow API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
