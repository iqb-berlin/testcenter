import {Controller, Get, HttpException, Post, Req} from '@nestjs/common';
import {Request} from 'express';
import {isSessionChange, SessionChange} from './SessionChange.interface';
import {DataService} from './data.service';

@Controller()
export class SessionChangeController {

    constructor(
        private readonly dataService: DataService
    ) {}


    @Post('/push/session-change')
    pushSessionChange(@Req() request: Request): void {

        if (!isSessionChange(request.body)) {

            throw new HttpException("not session data", 400);
        }

        this.dataService.applySessionChange(request.body);
    }


    @Get('/test-sessions')
    getTestSessions(): SessionChange[] {

        return this.dataService.getTestSessions();
    }

}
