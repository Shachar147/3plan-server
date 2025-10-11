import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import * as bodyParser from 'body-parser';

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

async function bootstrap() {
  console.log('starting bootstrap');
  const app = await NestFactory.create(AppModule, adapter);

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  // Enable CORS
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

  // Validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Triplan API Documentation')
    .setDescription('Official documentation of Triplan.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('/api/doc', app, document, {
    customCss: 'input { max-width: unset !important; }',
  });

  // Body parser
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  console.log('NestJS app initialized');
}

// Only bootstrap NestJS once
bootstrap();

export default serverlessExpress({ app: expressApp });
