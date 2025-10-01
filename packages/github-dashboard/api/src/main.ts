/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend access
  app.enableCors({
    origin: ['http://localhost:4202', 'http://localhost:4201'], // Allow both ports
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  // Enable global validation for DTOs: whitelisting removes unknown props,
  // forbidNonWhitelisted rejects unexpected fields, transform converts types
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`🚀 GitHub Dashboard API is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`🚀 CORS enabled for frontend access`);
  Logger.log(`🚀 PostGraphile GraphQL endpoint is available at: http://localhost:5001/graphql`);
  Logger.log(`🚀 PostGraphile GraphiQL playground is available at: http://localhost:5001/graphiql`);
  Logger.log(`🚀 React Web App is available at: http://localhost:4202`);
}

bootstrap();
