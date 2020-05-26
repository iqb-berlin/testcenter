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

    return (arg.personId !== undefined) && (arg.timestamp !== undefined);
  }


  private updateStatus(statusUpdate: StatusUpdate) {

    console.log('received', JSON.stringify(statusUpdate));

    if (typeof this.status[statusUpdate.personId] !== "undefined") {

      const oldStatus = this.status[statusUpdate.personId];

      if ((statusUpdate.testId) && (statusUpdate.testId !== oldStatus.testId)) {

        oldStatus.testState = {};
        oldStatus.unitState = {};
        oldStatus.bookletName = '';
        oldStatus.testLabel = '';
      }

      if ((statusUpdate.unitName) && (statusUpdate.unitName !== oldStatus.unitName)) {

        oldStatus.unitState = {};
      }

      statusUpdate.unitState = {...oldStatus.unitState, ...statusUpdate.unitState};
      statusUpdate.testState = {...oldStatus.testState, ...statusUpdate.testState};

      statusUpdate = {...oldStatus, ...statusUpdate};

      console.log('stored as', JSON.stringify(statusUpdate));

    }

    this.status[statusUpdate.personId] = statusUpdate;
  }


  @Post('/call')
  getHello(@Req() request: Request): void {

    if (AppController.isStatusUpdate(request.body)) {

      this.updateStatus(request.body);
      this.eventsGateway.broadcast("status", Object.values(this.status));

    } else {

      console.log("unknown message", request.body);
    }
  }
}
