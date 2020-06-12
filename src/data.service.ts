import {Injectable} from '@nestjs/common';
import {SessionChange} from './SessionChange.interface';
import {EventsGateway} from './events.gateway';
import {Monitor} from './Monitor.interface';

const mergeSessionChanges = (testSession: SessionChange, sessionChange: SessionChange): SessionChange => {

    if ((sessionChange.testId) && (sessionChange.testId !== testSession.testId)) {

        testSession.testState = {};
        testSession.unitState = {};
        testSession.bookletName = '';
    }

    if ((sessionChange.unitName) && (sessionChange.unitName !== testSession.unitName)) {

        testSession.unitState = {};
    }

    sessionChange.unitState = {...testSession.unitState, ...sessionChange.unitState};
    sessionChange.testState = {...testSession.testState, ...sessionChange.testState};

    return {...testSession, ...sessionChange};
}


@Injectable()
export class DataService {

    constructor(
        private readonly eventsGateway: EventsGateway
    ) {}

    private testSessions: {
        [group: string]: {
            [sessionId: string]: SessionChange
        }
    } = {};

    private monitors: {
        [group: string]: {
            [token: string]: Monitor
        }
    } = {};


    public applySessionChange(sessionChange: SessionChange) {

        console.log('sessionChange received', JSON.stringify(sessionChange));

        this.addSessionChange(sessionChange);
        this.broadcastTestSessionsToGroupMonitors(sessionChange.groupName);
    }


    private addSessionChange(sessionChange: SessionChange): void {

        const group: string = sessionChange.groupName;
        const sessionId = sessionChange.personId + '|' + sessionChange.testId;

        // testSession is first of group
        if (typeof this.testSessions[group] === "undefined") {

            console.log("don't log group:" + group);
            return;
        }

        const sessionIdWithoutTest = sessionChange.personId + '|-1';

        if ((sessionChange.testId > -1) && (typeof this.testSessions[group][sessionIdWithoutTest] !== "undefined")) {

            // testSession is already known, and needs to be updated and no test was started
            const testSession = this.testSessions[group][sessionIdWithoutTest];
            delete this.testSessions[group][sessionIdWithoutTest];
            this.testSessions[group][sessionId] = mergeSessionChanges(testSession, sessionChange);


        } else if (typeof this.testSessions[group][sessionId] !== "undefined") {

            // testSession is already known and needs to be updated
            const testSession = this.testSessions[group][sessionId];
            this.testSessions[group][sessionId] = mergeSessionChanges(testSession, sessionChange);

        } else {

            // formally unknown testSession
            this.testSessions[group][sessionId] = sessionChange;
        }
    }


    private broadcastTestSessionsToGroupMonitors(groupName: string) {

        if (typeof this.monitors[groupName] !== "undefined") {

            console.log("sending about " + groupName);
            const tokens = Object.keys(this.monitors[groupName]);
            const sessions =  Object.values(this.testSessions[groupName]);
            this.eventsGateway.broadCastToRegistered(tokens, "test-sessions", sessions);
        }
    }


    public addMonitor(monitor: Monitor): void {

        monitor.groups.forEach((group: string) => {

            if (typeof this.monitors[group] === "undefined") {

                this.monitors[group] = {};
            }

            if (typeof this.testSessions[group] === "undefined") {

                this.testSessions[group] = {};
            }

            this.monitors[group][monitor.token] = monitor;
        });
    }


    public removeMonitor(monitor: Monitor): void {

        Object.keys(this.monitors).forEach((group: string) => {

            if (typeof this.monitors[group][monitor.token] !== "undefined") {
                delete this.monitors[group][monitor.token];

                if (Object.keys(this.monitors[group]).length === 0) {
                    delete this.testSessions[group];
                }
            }
        });
    }
}
