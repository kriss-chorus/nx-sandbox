/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { postgraphile } from 'postgraphile';

import { AppModule } from './app/app.module';
import databaseConfig from './config/database.config';

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
  
  // Add PostGraphile middleware (embedded in NestJS like client-demographic-api)
  const dbConfig = databaseConfig();
  app.use(
    postgraphile(
      {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.username,
        password: dbConfig.password,
        ssl: dbConfig.ssl,
      },
      ['public'], // Database schemas to expose
      {
        watchPg: true,
        graphiql: true,
        enhanceGraphiql: true,
        graphqlRoute: '/graphql',
        graphiqlRoute: '/graphiql',
        cors: true,
      }
    )
  );
  
  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`🚀 GitHub Dashboard API is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`🚀 PostGraphile GraphiQL playground is available at: http://localhost:${port}/graphiql`);
  Logger.log(`🚀 React Web App is available at: http://localhost:4202`);
}

bootstrap();
