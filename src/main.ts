import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as config from 'config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Triplan API Documentation')
    .setDescription('This is the official documentation of triplan.')
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


  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  console.log("heorku port: ", process.env.PORT);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
