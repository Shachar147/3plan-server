// src/index.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

// Create a promise that resolves when NestJS is ready
let serverlessHandler: ReturnType<typeof serverlessExpress> | null = null;

async function initNest() {
  const app = await NestFactory.create(AppModule, adapter);

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://threeplan-frontend.onrender.com',
      'https://3plan-frontend.vercel.app',
      'http://triplan.live',
      'https://triplan.live',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Triplan API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/doc', app, document);

  // Body parser
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Now create the serverless handler
  serverlessHandler = serverlessExpress({ app: expressApp });
}

// Initialize Nest immediately
initNest().catch((err) => {
  console.error('Failed to initialize NestJS', err);
});

// Vercel handler — wait until serverlessHandler is ready
export default async function handler(req: any, res: any) {
  if (!serverlessHandler) {
    // If Nest is still bootstrapping, wait
    await new Promise((resolve) => setTimeout(resolve, 50));
    return handler(req, res);
  }
  return serverlessHandler(req, res);
}
