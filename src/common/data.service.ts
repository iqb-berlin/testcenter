import {Injectable} from '@nestjs/common';
import {SessionChange} from '../test-session/session-change.interface';
import {Monitor} from '../monitor/monitor.interface';
import {WebsocketGateway} from './websocket.gateway';


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
        private readonly eventsGateway: WebsocketGateway
    ) {
        this.eventsGateway.getDisconnectionObservable().subscribe((disconnected: string) => {
            this.removeMonitor(disconnected);
        });
    }

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
            console.log("skipping group hence not monitored: " + group);
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
            console.log("broadcasting data about group: " + groupName);
            const tokens = Object.keys(this.monitors[groupName]);
            const sessions = (typeof this.testSessions[groupName] !== "undefined")
                ? Object.values(this.testSessions[groupName])
                : [];
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

    public removeMonitor(monitorToken: string): void {
        console.log('remove monitor: ' + monitorToken);

        Object.keys(this.monitors).forEach((group: string) => {
            if (typeof this.monitors[group][monitorToken] !== "undefined") {
                delete this.monitors[group][monitorToken];

                if (Object.keys(this.monitors[group]).length === 0) {
                    delete this.testSessions[group];
                }
            }
        });

        this.eventsGateway.disconnectClient(monitorToken);
    }

    public getMonitors(): Monitor[] {
        return Object.values(this.monitors)
            .reduce(
                (allMonitors: Monitor[], groupMonitors: {[g: string]: Monitor}): Monitor[] =>
                    allMonitors.concat(Object.values(groupMonitors)),
                []
            )
            .filter((v: Monitor, i: number, a: Monitor[]) => a.indexOf(v) === i);
    }

    public getTestSessions(): SessionChange[] {
        return Object.values(this.testSessions)
            .reduce(
                (allTestSessions: SessionChange[], groupTestSessions: {[g: string]: SessionChange}): SessionChange[] =>
                    allTestSessions.concat(Object.values(groupTestSessions)),
                []
            );
    }

    public getClientTokens(): string[] {
        return this.eventsGateway.getClientTokens();
    }
}
