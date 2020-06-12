import {Controller, Post, Req} from '@nestjs/common';
import {Request} from 'express';
import {isMonitor} from './Monitor.interface';
import {DataService} from './data.service';

@Controller()
export class MonitorController {

    constructor(
        private readonly dataService: DataService
    ) {}


    @Post('/monitor/register')
    monitorRegister(@Req() request: Request): void {

        if (!isMonitor(request.body)) {
            console.log("unknown message", request.body); // TODO error handling
            return;
        }

        console.log("monitor registered:", request.body);
        this.dataService.addMonitor(request.body);
    }


    @Post('/monitor/unregister')
    monitorUnregister(@Req() request: Request): void {

        if (!isMonitor(request.body)) {
            console.log("unknown message", request.body); // TODO error handling
            return;
        }

        console.log("monitor unregistered:", request.body);
        this.dataService.removeMonitor(request.body);
    }
}
