import { Module } from '@nestjs/common';
import {AppController} from './app.controller';
import {EventsGateway} from './events.gateway';

@Module({
  controllers: [AppController],
  providers: [EventsGateway],
})
export class AppModule {}
