import {Controller, Post, Req, Logger} from '@nestjs/common';
import {Request} from 'express';
import {TestSessionService} from '../test-session/test-session.service';
import {TesteeService} from '../testee/testee.service';
import {WebsocketGateway} from '../common/websocket.gateway';

@Controller()
export class SystemController {

    constructor(
        private readonly dataService: TestSessionService,
        private readonly testeeService: TesteeService,
        private readonly wsGateway: WebsocketGateway,
    ) {}

    private readonly logger = new Logger(SystemController.name);

    @Post('/system/clean')
    clean(@Req() request: Request): void {
        this.logger.warn('clean system');
        this.wsGateway.disconnectAll();
        this.dataService.clean();
        this.testeeService.clean();
    }
}
