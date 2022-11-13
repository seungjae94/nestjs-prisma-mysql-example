import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';

dotenv.config({
  path: path.resolve('.env'),
});

async function bootstrap() {
  const PORT = 3000;
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
  Logger.log(`Application running on port ${PORT}`);
}
bootstrap();
