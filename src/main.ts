import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as config from 'config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NBA21 API Documentation')
    .setDescription('This is the official documentation of NBA21.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  fs.writeFileSync(
    './swagger.json',
    JSON.stringify(document).replace('"openapi":"3.0.0"', '"swagger":"2.0"'),
  );

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const Swagger2Postman = require('swagger2-postman-generator');
  // Swagger2Postman.convertSwagger().fromFile('swagger.json').toPostmanCollectionFile('postman_collection.json');

  SwaggerModule.setup('/api/doc', app, document, {
    customCss: 'input { max-width: unset !important; }',
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
