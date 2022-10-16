"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    app.enableCors();
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('NBA21 API Documentation')
        .setDescription('This is the official documentation of NBA21.')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    const fs = require('fs');
    fs.writeFileSync('./swagger.json', JSON.stringify(document).replace('"openapi":"3.0.0"', '"swagger":"2.0"'));
    swagger_1.SwaggerModule.setup('/api/doc', app, document, {
        customCss: 'input { max-width: unset !important; }',
    });
    await app.listen(process.env.PORT || 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map