import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const isDevelopment = !!process.env.DEV_MODE;
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      logger: isDevelopment ? console : ['warn', 'error']
    }
  );
  app.disable('x-powered-by', 'X-Powered-By');
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(3000);
  // eslint-disable-next-line no-console
  console.log(`Broadcasting Service is running (Debug-Level: ${isDevelopment ? 'dev' : 'prod'})`);
}
bootstrap();
