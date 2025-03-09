import { Module } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { modelDefinitions, moduleDefinition } from './app.module';

@Module({
  imports: [],
  controllers: moduleDefinition.controllers,
  providers: [
    ...moduleDefinition.providers.map((provide) => ({ provide, useValue: undefined })),
    ...modelDefinitions.map((modelDefinition) => ({ provide: getModelToken(modelDefinition.name), useValue: undefined })),
  ],
})
export class SwaggerAppModule {}
