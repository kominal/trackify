import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { AppModule } from './app.module';
import { ErrorFilter } from './helpers/exception-filter';
import { CustomerLogger } from './helpers/logger';
import { SwaggerAppModule } from './swagger-app.module';

process.on('uncaughtException', (exception) => {
  console.log(exception);
});

process.on('unhandledRejection', (exception) => {
  console.log(exception);
});

async function createApplication(module: any): Promise<INestApplication> {
  const app = await NestFactory.create(module, {
    logger: new CustomerLogger(),
    cors: { origin: '*' },
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ErrorFilter());
  app.enableCors();
  app.use(json({ limit: '20mb' }));

  return app;
}

function createSwaggerDocument(app: INestApplication): any {
  const config = new DocumentBuilder()
    .setTitle('Core')
    .addServer('/api/core', 'Current installation')
    .addServer('https://app.trackify.com/api/core/api', 'Production')
    .addBearerAuth() //
    .build();

  return JSON.stringify(SwaggerModule.createDocument(app, config));
}

export async function bootstrap(): Promise<void> {
  if (process.env.GENERATE_SWAGGER) {
    writeFileSync('swagger.json', createSwaggerDocument(await createApplication(SwaggerAppModule)));
  } else {
    const app = await createApplication(AppModule);
    SwaggerModule.setup('docs/internal', app, JSON.parse(readFileSync('swagger.json', 'utf8')));
    await app.listen(3000);
  }
}
bootstrap();
