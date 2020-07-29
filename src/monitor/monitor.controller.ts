import {Controller, Get, HttpException, Post, Req} from '@nestjs/common';
import {Request} from 'express';
import {isMonitor, Monitor} from './monitor.interface';
import {DataService} from '../common/data.service';

@Controller()
export class MonitorController {

    constructor(
        private readonly dataService: DataService
    ) {}


    @Post('/monitor/register')
    monitorRegister(@Req() request: Request): void {
        if (!isMonitor(request.body)) {
            throw new HttpException("not monitor data", 400);
        }

        console.log("monitor registered:" + JSON.stringify(request.body));
        this.dataService.addMonitor(request.body);
    }


    @Post('/monitor/unregister')
    monitorUnregister(@Req() request: Request): void {
        if (!('token' in request.body)) {
            throw new HttpException("no token in body", 400);
        }

        console.log("monitor unregistered:", request.body);
        this.dataService.removeMonitor(request.body['token']);
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
