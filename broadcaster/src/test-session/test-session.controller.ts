import {
  Controller, Get, HttpException, Logger, Post, Req
} from '@nestjs/common';
import { Request } from 'express';
import { isSessionChange, TestSessionChange, isSessionChangeArray } from 'testcenter-common/interfaces/test-session-change.interface';
import { TestSessionService } from './test-session.service';

@Controller()
export class TestSessionController {
  constructor(
    private readonly dataService: TestSessionService
  ) {}

  private readonly logger = new Logger(TestSessionController.name);

  @Post('/push/session-change')
  pushSessionChange(@Req() request: Request): void {
    if (!isSessionChange(request.body)) {
      throw new HttpException('not session data', 400);
    }

    // this.logger.log('/push/session-change', JSON.stringify(request.body));
    this.dataService.applySessionChange(request.body);
  }

  @Post('/push/session-changes')
  pushSessionChanges(@Req() request: Request): void {
    if (!isSessionChangeArray(request.body)) {
      throw new HttpException('not session data', 400);
    }

    this.dataService.applySessionChanges(request.body);
  }

  @Get('/test-sessions')
  getTestSessions(): TestSessionChange[] {
    return this.dataService.getTestSessions();
  }
}
