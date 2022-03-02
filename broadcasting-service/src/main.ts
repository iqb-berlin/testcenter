import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  const isDevelopment = !!process.env.DEV_MODE;
  const app = await NestFactory.create(AppModule, { logger: isDevelopment ? console : ['warn', 'error'] });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log('Broadcasting Service is running');
}
bootstrap();
