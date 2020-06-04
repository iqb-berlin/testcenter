import { Module } from '@nestjs/common';
import {SessionChangeController} from './sessionChangeController';
import {EventsGateway} from './events.gateway';

@Module({
  controllers: [SessionChangeController],
  providers: [EventsGateway],
})
export class AppModule {}
