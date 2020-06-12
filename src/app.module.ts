import { Module } from '@nestjs/common';
import {SessionChangeController} from './sessionChangeController';
import {MonitorController} from './MonitorController';
import {EventsGateway} from './events.gateway';
import {DataService} from './data.service';
import {APP_FILTER} from '@nestjs/core';
import {AllExceptionsFilter} from './ErrorHandler';


@Module({
  controllers: [SessionChangeController, MonitorController],
  providers: [
      EventsGateway,
      DataService,
      {
        provide: APP_FILTER,
        useClass: AllExceptionsFilter,
      }
  ],
})
export class AppModule {}
