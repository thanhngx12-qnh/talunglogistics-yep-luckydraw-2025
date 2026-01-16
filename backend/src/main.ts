// File: backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors();
  
  // FIX ĐƯỜNG DẪN: NestJS phục vụ folder /app/public trong container
  // Đường dẫn tuyệt đối trong container của thư mục public là: /app/public
  const staticAssetsPath = join('/app', 'public'); 

  app.useStaticAssets(staticAssetsPath, {
    prefix: '/public/',
  });

  await app.listen(3001);
  console.log('Application is running on: http://localhost:3001');
}
bootstrap();
