// src/index.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const serverPromise = (async () => {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://threeplan-frontend.onrender.com',
      'https://3plan-frontend.vercel.app',
      'http://triplan.live',
      'https://triplan.live',
      'https://www.triplan.live', // added
    ],
    credentials: true,
  });
  

  // Validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Triplan API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT'
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/doc', app, document);

  // Body parser
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Initialize Nest without calling listen()
  await app.init();
  return expressApp;
})();

// Vercel handler
export default async function handler(req: Request, res: Response) {
  const server = await serverPromise;
  server(req, res);
}
