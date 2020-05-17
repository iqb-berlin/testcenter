import {Controller, Post, Req} from '@nestjs/common';
import {EventsGateway} from './events.gateway';
import { Request } from 'express';
import {StatusUpdate} from './test.interface';

@Controller()
export class AppController {

  constructor(
      private readonly eventsGateway: EventsGateway
  ) {}


  private status: {[person: string]: StatusUpdate} = {};


  private static isStatusUpdate(arg: any): arg is StatusUpdate {

    return (arg.person !== undefined) && (arg.status !== undefined) && (arg.test !== undefined);
  }


  private updatePersonsStatus(statusUpdate: StatusUpdate) {

    if (!statusUpdate.personName
        && (typeof this.status[statusUpdate.person]  !== "undefined")
        && (typeof this.status[statusUpdate.person].personName !== "undefined")
    ) {
      statusUpdate.personName = this.status[statusUpdate.person].personName;
    }

    if (!statusUpdate.testName
        && (typeof this.status[statusUpdate.person]  !== "undefined")
        && (typeof this.status[statusUpdate.person].testName !== "undefined")
    ) {
      statusUpdate.testName = this.status[statusUpdate.person].testName;
    }

    this.status[statusUpdate.person] = statusUpdate;
  }


  @Post('/call')
  getHello(@Req() request: Request): string {

    if (AppController.isStatusUpdate(request.body)) {

      this.updatePersonsStatus(request.body);
      this.eventsGateway.broadcast("status", Object.values(this.status));

    } else {

      console.log("unknown message", request.body);
    }

    return 'callabalal';
  }
}
