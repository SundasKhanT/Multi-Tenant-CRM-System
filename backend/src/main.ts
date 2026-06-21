// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow frontend to call backend
  // app.enableCors({
  //   origin: 'http://localhost:3001', // frontend port
  //   credentials: true,
  // });

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Validate all incoming request bodies automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // throw error on unknown fields
      transform: true, // auto-convert types (e.g. string → number)
    }),
  );

  app.setGlobalPrefix('api');

  // await app.listen(process.env.PORT ?? 3000);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(
    `🚀 Backend running at http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

bootstrap();
