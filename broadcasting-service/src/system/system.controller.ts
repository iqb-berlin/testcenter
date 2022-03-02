import {
  Controller, Post, Logger, Get, HttpCode
} from '@nestjs/common';
import { TestSessionService } from '../test-session/test-session.service';
import { TesteeService } from '../testee/testee.service';
import { WebsocketGateway } from '../common/websocket.gateway';

@Controller()
export class SystemController {
  constructor(
    private readonly dataService: TestSessionService,
    private readonly testeeService: TesteeService,
    private readonly wsGateway: WebsocketGateway
  ) {}

  private readonly logger = new Logger(SystemController.name);

  @Post('/system/clean')
  clean(): void {
    this.logger.warn('clean system');
    this.wsGateway.disconnectAll();
    this.dataService.clean();
    this.testeeService.clean();
  }

  @Get('')
  @HttpCode(200)
  // eslint-disable-next-line class-methods-use-this
  root(): void {
    this.logger.log('ping');
  }
}
