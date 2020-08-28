import {Controller, HttpException, Post, Req} from '@nestjs/common';
import {Request} from 'express';
import {isArray} from 'util';
import {isCommand} from './command.interface';
import {TesteeService} from '../testee/testee.service';

@Controller()
export class CommandController {
    constructor(
        private readonly testeeService: TesteeService
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

        this.testeeService.broadcastCommandToTestees(request.body.command, request.body.testIds);
    }
}

