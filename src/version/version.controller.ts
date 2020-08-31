import {Controller, Get, Req} from '@nestjs/common';
import {Request} from 'express';
import {version} from '../../package.json';


@Controller()
export class VersionController {

    @Get('/version')
    monitors(@Req() request: Request): string {
        return version;
    }
}
