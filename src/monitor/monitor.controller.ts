import {
  Controller, Get, HttpException, Logger, Post, Req
} from '@nestjs/common';
import { Request } from 'express';
import { isMonitor, Monitor } from './monitor.interface';
import { TestSessionService } from '../test-session/test-session.service';

@Controller()
export class MonitorController {
  constructor(
    private readonly dataService: TestSessionService
  ) {}

  private readonly logger = new Logger(MonitorController.name);

  @Post('/monitor/register')
  monitorRegister(@Req() request: Request): void {
    if (!isMonitor(request.body)) {
      throw new HttpException('not monitor data', 400);
    }

    this.logger.log(`monitor registered:${JSON.stringify(request.body)}`);
    this.dataService.addMonitor(request.body);
  }

  @Post('/monitor/unregister')
  monitorUnregister(@Req() request: Request): void {
    if (!('token' in request.body)) {
      throw new HttpException('no token in body', 400);
    }

    this.logger.log('monitor unregistered:', request.body);
    this.dataService.removeMonitor(request.body.token);
  }

  @Get('/monitors')
  monitors(@Req() request: Request): Monitor[] {
    return this.dataService.getMonitors();
  }

  @Get('/clients')
  clients(@Req() request: Request): string[] {
    return this.dataService.getClientTokens();
  }
}
