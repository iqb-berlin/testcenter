import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['warn', 'error'] });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(3000);
  console.log(`Broadcasting Service is running on: ${await app.getUrl()}`);
}
bootstrap();
