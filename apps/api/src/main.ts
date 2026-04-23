import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as path from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use((helmet as any).default());

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS — allow localhost + any URLs listed in FRONTEND_URL (comma-separated)
  const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
      : []),
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
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

  // Serve uploaded files (private docs should migrate to S3 for production)
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  app.use('/uploads', express.static(path.resolve(uploadDir)));

  // Swagger — disabled in production to avoid exposing API surface
  if (process.env.NODE_ENV !== 'production') {
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
  }

  // Health check endpoint (used by Railway)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health', (_req: unknown, res: { json: (o: object) => void }) => {
    res.json({ status: 'ok' });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`FreightFlow API running on port ${port}`);
}

bootstrap();
