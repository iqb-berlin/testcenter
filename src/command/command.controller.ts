import {Controller, Post} from '@nestjs/common';
import {WebsocketGateway} from '../common/websocket.gateway';

@Controller()
export class CommandController {
    constructor(
        private readonly websocketGateway: WebsocketGateway
    ) {}

    @Post('/command')
    postCommand(id: string, keyword: string, parameter: string[], testIds: number[]) {
        const testIdsStrings = testIds.map(testId => testId.toString());
        this.websocketGateway.broadcastToRegistered(testIdsStrings, 'command', {id, keyword, parameter});
    }
}

