import {Controller, Post, Req} from '@nestjs/common';
import {EventsGateway} from './events.gateway';
import {Request} from 'express';
import {isSessionChange, SessionChange} from './SessionChange.interface';

@Controller()
export class SessionChangeController {

  constructor(
      private readonly eventsGateway: EventsGateway
  ) {}


  private status: {[person: string]: SessionChange} = {};


  @Post('/push/session-change')
  pushSessionChange(@Req() request: Request): void {

    if (isSessionChange(request.body)) {

      this.applySessionChange(request.body);
      this.eventsGateway.broadcast("status", Object.values(this.status));

    } else {

      console.log("unknown message", request.body);
    }
  }


  private applySessionChange(sessionChange: SessionChange) {

    console.log('sessionChange received', JSON.stringify(sessionChange));

    const sessionId = sessionChange.personId + '|' + sessionChange.testId;

    if (typeof this.status[sessionId] !== "undefined") {

      const oldStatus = this.status[sessionId];

      if ((sessionChange.testId) && (sessionChange.testId !== oldStatus.testId)) {

        oldStatus.testState = {};
        oldStatus.unitState = {};
        oldStatus.bookletName = '';
      }

      if ((sessionChange.unitName) && (sessionChange.unitName !== oldStatus.unitName)) {

        oldStatus.unitState = {};
      }

      sessionChange.unitState = {...oldStatus.unitState, ...sessionChange.unitState};
      sessionChange.testState = {...oldStatus.testState, ...sessionChange.testState};

      sessionChange = {...oldStatus, ...sessionChange};
    }

    this.status[sessionId] = sessionChange;
  }
}
