import { Controller, Get } from '@nestjs/common';
import {EventsGateway} from './events.gateway';


@Controller()
export class AppController {
  constructor(
      private readonly eventsGateway: EventsGateway
  ) {}

  @Get('/call')
  getHello(): string {
    this.eventsGateway.broadcast("wtf", "stuff");

    return 'called';
  }
}
