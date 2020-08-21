import {Injectable} from '@nestjs/common';
import {Testee} from './testee.interface';
import {WebsocketGateway} from '../common/websocket.gateway';
import {Command} from '../command/command.interface';

@Injectable()
export class TesteeService {
    constructor(
        private readonly websocketGateway: WebsocketGateway
    ) {
        this.websocketGateway.getDisconnectionObservable().subscribe((disconnected: string) => {
            this.removeTestee(disconnected);
        });
    }

    private testees: {[token: string]: Testee} = {};

    public addTestee(testee: Testee): void {
        this.testees[testee.token] = testee;
    }

    public removeTestee(testeeToken: string): void {
        console.log('remove testee: ' + testeeToken);

        if (typeof this.testees[testeeToken] !== "undefined") {
            delete (this.testees[testeeToken]);
        }

        this.websocketGateway.disconnectClient(testeeToken);
    }

    public getTestees(): Testee[] {
        return Object.values(this.testees);
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
}
