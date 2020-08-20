import {Controller, HttpException, Post, Req} from '@nestjs/common';
import {WebsocketGateway} from '../common/websocket.gateway';
import {Request} from 'express';
import {isArray} from 'util';
import {isCommand} from './command.interface';

@Controller()
export class CommandController {
    constructor(
        private readonly websocketGateway: WebsocketGateway
    ) {}

    @Post('/command')
    postCommand(@Req() request: Request): void {

        if ((typeof request.body.command === "undefined") || !isCommand(request.body.command)) {
            throw new HttpException("invalid command data", 400);
        }

        if ((typeof request.body.testIds === "undefined") || !isArray(request.body.testIds)) {
            throw new HttpException("bo testIds given", 400);
        }

        console.log('command', request.body);

        const testIdsStrings = request.body.testIds.map(testId => testId.toString());
        this.websocketGateway.broadcastToRegistered(testIdsStrings, 'commands', [
            {
                id: request.body.id,
                keyword: request.body.keyword,
                arguments: request.body.arguments
            }
        ]);
    }
}

