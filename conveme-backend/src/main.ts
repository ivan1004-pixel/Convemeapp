import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'body-parser';
import { ValidationPipe } from '@nestjs/common';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  // Mover esto al inicio para asegurar que el parser maneje payloads grandes
  app.use(json({ limit: "100mb" }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  // Habilitar validación global (necesario para class-validator)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true, // Volvemos a estricto para mantener seguridad
    transform: true,
  }));

  app.enableCors({
    origin: (origin, callback) => callback(null, origin),
    credentials: true,
  });

  // Escuchando en el puerto 3000 como solicitó el usuario
  await app.listen(3000);
  console.log('🚀 Backend running on http://localhost:3000/graphql');
}

bootstrap();
