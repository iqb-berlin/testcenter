import {
  Controller, Get, HttpException, Logger, Post, Req
} from '@nestjs/common';
import { Request } from 'express';
import { TesteeService } from './testee.service';
import { isTestee, Testee } from './testee.interface';

@Controller()
export class TesteeController {
  constructor(
    private readonly testeeService: TesteeService
  ) {
  }

  private readonly logger = new Logger(TesteeController.name);

  @Post('/testee/register')
  testeeRegister(@Req() request: Request): void {
    if (!isTestee(request.body)) {
      throw new HttpException('not testee data', 400);
    }

    this.logger.log(`testee registered:${JSON.stringify(request.body)}`);
    this.testeeService.addTestee(request.body);
  }

  @Post('/testee/unregister')
  testeeUnregister(@Req() request: Request): void {
    if (!('token' in request.body)) {
      throw new HttpException('no token in body', 400);
    }

    this.logger.log('testee unregistered:', request.body);
    this.testeeService.removeTestee(request.body.token);
  }

  @Get('/testees')
  testees(@Req() request: Request): Testee[] {
    return this.testeeService.getTestees();
  }
}
