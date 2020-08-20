import {Module} from '@nestjs/common';
import {TestSessionController} from './test-session/test-session.controller';
import {MonitorController} from './monitor/monitor.controller';
import {WebsocketGateway} from './common/websocket.gateway';
import {DataService} from './common/data.service';
import {APP_FILTER} from '@nestjs/core';
import {ErrorHandler} from './common/error-handler';
import {VersionController} from './version/version.controller';
import {CommandController} from './command/command.controller';


@Module({
  controllers: [
      TestSessionController,
      MonitorController,
      VersionController,
      CommandController
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
