import {Controller, Post, Req} from '@nestjs/common';
import {EventsGateway} from './events.gateway';
import { Request } from 'express';
import {TestInstance} from './test.interface';

@Controller()
export class AppController {

  constructor(
      private readonly eventsGateway: EventsGateway
  ) {}


  private tests: {[person: string]: TestInstance} = {};


  private static isTestInstance(arg: any): arg is TestInstance {

    return (arg.person !== undefined) && (arg.status !== undefined) && (arg.test !== undefined);
  }


  private updatePersonsStatus(testInstance: TestInstance) {

    this.tests[testInstance.person] = testInstance;
  }


  @Post('/call')
  getHello(@Req() request: Request): string {

    if (AppController.isTestInstance(request.body)) {

      this.updatePersonsStatus(request.body);
      this.eventsGateway.broadcast("tests", Object.values(this.tests));

    } else {

      console.log("unknown message", request.body);
    }

    return 'callabalal';
  }
}
