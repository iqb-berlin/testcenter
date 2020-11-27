import {HttpService, Injectable, Logger} from '@nestjs/common';
import {Testee} from './testee.interface';
import {WebsocketGateway} from '../common/websocket.gateway';
import {Command} from '../command/command.interface';

@Injectable()
export class TesteeService {
    constructor(
        private readonly websocketGateway: WebsocketGateway,
        private http: HttpService
    ) {
        this.websocketGateway.getDisconnectionObservable().subscribe((disconnected: string) => {
            this.notifyDisconnection(disconnected);
            this.removeTestee(disconnected);
        });
    }

    private readonly logger = new Logger(TesteeService.name);

    private testees: {[token: string]: Testee} = {};

    public addTestee(testee: Testee): void {
        this.testees[testee.token] = testee;
    }

    public removeTestee(testeeToken: string): void {
        this.logger.log('remove testee: ' + testeeToken);

        if (typeof this.testees[testeeToken] !== "undefined") {
            delete this.testees[testeeToken];
        }

        this.websocketGateway.disconnectClient(testeeToken);
    }

    public getTestees(): Testee[] {
        return Object.values(this.testees);
    }

    notifyDisconnection(testeeToken: string): void {
        if (typeof this.testees[testeeToken] === "undefined") {
            return;
        }
        if (this.testees[testeeToken].disconnectNotificationUri) {
            this.http.post(this.testees[testeeToken].disconnectNotificationUri).subscribe(
                () => {
                    this.logger.log(`sent connection-lost signal to ${this.testees[testeeToken].disconnectNotificationUri}`)
                },
                error => {
                    this.logger.warn(`could not sent connection-lost signal to 
                        ${this.testees[testeeToken].disconnectNotificationUri}: ${error.message}`)
                }
            );
        }
    }

    broadcastCommandToTestees(command: Command, testIds: number[]) {
        testIds.forEach((testId => {
            this.websocketGateway.broadcastToRegistered(
                Object.values(this.testees)
                    .filter(testee => testee.testId == testId)
                    .map(testee => testee.token),
                'commands',
                [command]
            );
        }));
    }

    public clean(): void {
        this.testees = {};
    }
}
