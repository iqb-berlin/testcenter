import {
  Catch, ArgumentsHost, HttpStatus, Logger
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { WebsocketGateway } from './websocket.gateway';

@Catch()
export class ErrorHandler extends BaseExceptionFilter {

  constructor(
    private readonly eventsGateway: WebsocketGateway
  ) {
    super();
  }

  private readonly logger = new Logger(ErrorHandler.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception.status === HttpStatus.NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    }

    if (exception.status === HttpStatus.SERVICE_UNAVAILABLE) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
    }

    if (exception.status === HttpStatus.NOT_ACCEPTABLE) {
      status = HttpStatus.NOT_ACCEPTABLE;
    }

    if (exception.status === HttpStatus.EXPECTATION_FAILED) {
      status = HttpStatus.EXPECTATION_FAILED;
    }

    if (exception.status === HttpStatus.BAD_REQUEST) {
      status = HttpStatus.BAD_REQUEST;
    }

    const message = exception.message;

    this.logger.error(`(${status}) ${message}`);

    response
      .status(status)
      .contentType('text')
      .send(message);

    if (status >= 500) {
      this.eventsGateway.disconnectAll();
    }
  }
}
