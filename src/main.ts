import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { Server } from 'ws';
import {MyWebSocketGateway} from "./websocket/websocket.gateway";
import {ValidationPipe} from "@nestjs/common";
const express = require('express');
import { ExpressAdapter } from '@nestjs/platform-express';

import { createServer, proxy } from 'aws-serverless-express';
const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

async function bootstrap() {
  console.log("starting boostrap");
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create(AppModule, adapter);


  console.log("created app");

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  app.enableCors({
    origin: [
      'http://localhost:3000',                 // local frontend
      'https://threeplan-frontend.onrender.com', // deployed frontend
      'https://3plan-frontend.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  console.log("after cors");

  // to auto-convert page="1" to page=1
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

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

  console.log("after swagger");

  // to create a swagger documentation page on /api :
  // not sure if it's a smart Idea tho, since it'll expose the whole API to attackers
  // SwaggerModule.setup('api', app, document);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  
  // Only write swagger.json in development (not in Vercel's read-only environment)
  if (process.env.NODE_ENV !== 'production') {
    try {
      fs.writeFileSync(
        './swagger.json',
        JSON.stringify(document).replace('"openapi":"3.0.0"', '"swagger":"2.0"'),
      );
    } catch (error) {
      console.warn('Could not write swagger.json file:', error.message);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const Swagger2Postman = require('swagger2-postman-generator');
  // Swagger2Postman.convertSwagger().fromFile('swagger.json').toPostmanCollectionFile('postman_collection.json');

  SwaggerModule.setup('/api/doc', app, document, {
    customCss: 'input { max-width: unset !important; }',
  });

  console.log("after swagger doc");


  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  if (process.env.NODE_ENV !== 'production') {
    // console.log("heroku port: ", process.env.PORT);
    await app.listen(process.env.PORT || 3001);

    console.log("after app listen, port:", process.env.PORT || 3001);
  }

  // Create WebSocket server instance
  const server = new Server({ noServer: true });

  setTimeout(() => {
    console.log('Starting server in', process.env.NODE_ENV, 'mode', `http://localhost:${process.env.PORT || 3001}`);
  }, 1000);

  // Initialize the WebSocket gateway with the http.Server instance
  const webSocketGateway = app.get(MyWebSocketGateway);
  webSocketGateway.init(server);

  // Attach WebSocket server to the HTTP server
  app.getHttpServer().on('upgrade', (req, socket, head) => {
    server.handleUpgrade(req, socket, head, (ws) => {
      server.emit('connection', ws, req);
    });
  });

  console.log("after sockets");
}

// Always call bootstrap to start the application
bootstrap();


// Export handler for Vercel
export default (req, res) => {
  const server = createServer(expressApp);
  proxy(server, req, res);
};
