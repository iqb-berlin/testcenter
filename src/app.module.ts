import {Module} from '@nestjs/common';
import {TestSessionConstroller} from './test-session/test-session.constroller';
import {MonitorController} from './monitor/monitor.controller';
import {WebsocketGateway} from './common/websocket.gateway';
import {DataService} from './common/data.service';
import {APP_FILTER} from '@nestjs/core';
import {ErrorHandler} from './common/error-handler';


@Module({
  controllers: [
      TestSessionConstroller,
      MonitorController
  ],
  providers: [
      WebsocketGateway,
      DataService,
      {
        provide: APP_FILTER,
        useClass: ErrorHandler,
      }
  ],
})
export class AppModule {}
