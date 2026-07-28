import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguridad HTTP headers
  app.use(helmet());

  // Rate limiting: 100 peticiones por minuto por IP
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: { message: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
    }),
  );

  app.enableCors({
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Servidor corriendo en puerto ${process.env.PORT ?? 3000}`);
}
bootstrap();