import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Testee } from './testee.interface';
import { WebsocketGateway } from '../common/websocket.gateway';
import { Command } from '../command/command.interface';

@Injectable()
export class TesteeService {
  constructor(
    private readonly websocketGateway: WebsocketGateway,
    private readonly http: HttpService,
  ) {
    this.websocketGateway.getDisconnectionObservable().subscribe((disconnected: string) => {
      this.notifyDisconnection(disconnected);
      this.removeTestee(disconnected);
    });
  }

  private readonly logger = new Logger(TesteeService.name);

  private testees: { [token: string]: Testee } = {};

  addTestee(testee: Testee): void {
    this.testees[testee.token] = testee;
  }

  removeTestee(testeeToken: string): void {
    this.logger.log(`remove testee: ${testeeToken}`);

    if (typeof this.testees[testeeToken] !== 'undefined') {
      delete this.testees[testeeToken];
    }

    this.websocketGateway.disconnectClient(testeeToken);
  }

  getTestees(): Testee[] {
    return Object.values(this.testees);
  }

  notifyDisconnection(testeeToken: string): void {
    if (typeof this.testees[testeeToken] === 'undefined') {
      return;
    }
    if (this.testees[testeeToken].disconnectNotificationUri) {
      const uri = new URL(this.testees[testeeToken].disconnectNotificationUri);

      const disconnectNotificationUri = this.testees[testeeToken].disconnectNotificationUri.replace(uri.search, '');
      const testMode = uri.searchParams.get('testMode');
      const config = testMode ? { headers: { testMode } } : {};

      this.http.post(this.testees[testeeToken].disconnectNotificationUri, {}, config)
        .subscribe(
          () => {
            this.logger.log(`sent connection-lost signal to ${disconnectNotificationUri}`);
          },
          error => {
            this.logger.warn(`could not send connection-lost signal to ${disconnectNotificationUri}: ${error.message}`);
          }
        );
    }
  }

  broadcastCommandToTestees(command: Command, testIds: number[]) : void {
    testIds.forEach((testId => {
      this.websocketGateway.broadcastToRegistered(
        Object.values(this.testees)
          .filter(testee => testee.testId === testId)
          .map(testee => testee.token),
        'commands',
        [command]
      );
    }));
  }

  clean(): void {
    this.testees = {};
  }
}
