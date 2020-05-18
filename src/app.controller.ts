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

    if (typeof this.status[statusUpdate.personId] !== "undefined") {

      statusUpdate = {...this.status[statusUpdate.personId], ...statusUpdate};
    }

    this.status[statusUpdate.personId] = statusUpdate;
  }


  @Post('/call')
  getHello(@Req() request: Request): string {

    if (AppController.isStatusUpdate(request.body)) {

      this.updateStatus(request.body);
      this.eventsGateway.broadcast("status", Object.values(this.status));

    } else {

      console.log("unknown message", request.body);
    }

    return 'callabalal';
  }
}
