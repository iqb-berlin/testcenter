import {
  Controller, HttpException, Logger, Post, Req
} from '@nestjs/common';
import { Request } from 'express';
import { isCommand } from './command.interface';
import { TesteeService } from '../testee/testee.service';

@Controller()
export class CommandController {
  constructor(
    private readonly testeeService: TesteeService
  ) {}

  private readonly logger = new Logger(CommandController.name);

  @Post('/command')
  postCommand(@Req() request: Request): void {
    if ((typeof request.body.command === 'undefined') || !isCommand(request.body.command)) {
      throw new HttpException('invalid command data', 400);
    }

    if ((typeof request.body.testIds === 'undefined') || !Array.isArray(request.body.testIds)) {
      throw new HttpException('no testIds given', 400);
    }

    this.logger.log('/command', request.body);

    this.testeeService.broadcastCommandToTestees(request.body.command, request.body.testIds);
  }
}
