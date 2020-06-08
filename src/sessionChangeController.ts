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

      const mergeChanges = (oldStatus: SessionChange, sessionChange: SessionChange): SessionChange => {

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

          return {...oldStatus, ...sessionChange};
      }

      console.log('sessionChange received', JSON.stringify(sessionChange));

      const sessionId = sessionChange.personId + '|' + sessionChange.testId;
      const sessionIdWithoutTest = sessionChange.personId + '|-1';

      if ((sessionChange.testId > -1) && (typeof this.status[sessionIdWithoutTest] !== "undefined")) {

          // console.log("MERGE & DELETE TESTLESS");
          this.status[sessionId] = mergeChanges(this.status[sessionIdWithoutTest], sessionChange);
          delete this.status[sessionIdWithoutTest];

      } else if (typeof this.status[sessionId] !== "undefined") {

          // console.log("JUST MERGE");
          this.status[sessionId] = mergeChanges(this.status[sessionId], sessionChange);

      } else {

          // console.log("NEW");
          this.status[sessionId] = sessionChange;
      }
  }
}
