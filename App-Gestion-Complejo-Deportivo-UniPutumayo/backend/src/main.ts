import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { SERVER_PORT } from './config/constants';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  
  // Middleware para cookies
  app.use(cookieParser());

  // Configurar CORS para permitir cookies
  app.enableCors({ 
    origin: 'http://localhost:3000',
    credentials: true,
  });


  const port = configService.get<number>(SERVER_PORT) || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en el puerto ${port}`);
}
bootstrap();
