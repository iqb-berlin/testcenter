import {Controller, Post, Req} from '@nestjs/common';
import {Request} from 'express';
import {isSessionChange} from './SessionChange.interface';
import {DataService} from './data.service';

@Controller()
export class SessionChangeController {

    constructor(
        private readonly dataService: DataService
    ) {}


    @Post('/push/session-change')
    pushSessionChange(@Req() request: Request): void {

        if (!isSessionChange(request.body)) {
            console.log("unknown message", request.body); // TODO error handling
            return;
        }

        this.dataService.applySessionChange(request.body);
    }
}
