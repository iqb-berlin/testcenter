import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { BsLogger } from './logger';

async function bootstrap() {
  const isDevelopment = process.env.DEV_MODE === 'true';
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      logger: isDevelopment ? new BsLogger() : ['warn', 'error']
    }
  );
  app.disable('x-powered-by', 'X-Powered-By');
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log(`Broadcasting Service is running (Debug-Level: ${isDevelopment ? 'dev' : 'prod'})`);
}
bootstrap();
