import { Injectable, Logger } from '@nestjs/common';
import { TestSessionChange } from 'testcenter-common/interfaces/test-session-change.interface';
import { Monitor } from '../monitor/monitor.interface';
import { WebsocketGateway } from '../common/websocket.gateway';

const mergeSessionChanges = (testSession: TestSessionChange, sessionChange: TestSessionChange): TestSessionChange => {
  if ((sessionChange.unitName) && (sessionChange.unitName !== testSession.unitName)) {
    testSession.unitState = {};
  }

  sessionChange.unitState = { ...testSession.unitState, ...sessionChange.unitState };
  sessionChange.testState = { ...testSession.testState, ...sessionChange.testState };

  return { ...testSession, ...sessionChange };
};

@Injectable()
export class TestSessionService {
  constructor(
    private readonly websocketGateway: WebsocketGateway
  ) {
    this.websocketGateway.getDisconnectionObservable().subscribe((disconnected: string) => {
      this.removeMonitor(disconnected);
    });
  }

  private readonly logger = new Logger(TestSessionService.name);

  private testSessions: {
    [group: string]: {
      [sessionId: string]: TestSessionChange
    }
  } = {};

  private monitors: {
    [group: string]: {
      [token: string]: Monitor
    }
  } = {};

  applySessionChange(sessionChange: TestSessionChange): void {
    this.addSessionChange(sessionChange);
    this.broadcastTestSessionsToGroupMonitors(sessionChange.groupName);
  }

  applySessionChanges(sessionChanges: TestSessionChange[]): void {
    const groupsToBroadcast: string[] = [];
    sessionChanges.forEach(sessionChange => {
      this.addSessionChange(sessionChange);
      if (!groupsToBroadcast.includes(sessionChange.groupName)) {
        groupsToBroadcast.push(sessionChange.groupName);
      }
    });
    groupsToBroadcast.forEach(groupName => {
      this.broadcastTestSessionsToGroupMonitors(groupName);
    });
  }

  private addSessionChange(sessionChange: TestSessionChange): void {
    const group: string = sessionChange.groupName;
    const testId = sessionChange.testId;

    // testSession is first of group
    if (typeof this.testSessions[group] === 'undefined') {
      // this.logger.log("skipping group hence not monitored: " + group);
      return;
    }

    if (typeof this.testSessions[group][testId] !== 'undefined') {
      // testSession is already known and needs to be updated
      const testSession = this.testSessions[group][testId];
      this.testSessions[group][testId] = mergeSessionChanges(testSession, sessionChange);
    } else {
      // formally unknown testSession
      this.testSessions[group][testId] = sessionChange;
    }
  }

  private broadcastTestSessionsToGroupMonitors(groupName: string) {
    if (typeof this.monitors[groupName] !== 'undefined') {
      // this.logger.log("broadcasting data about group: " + groupName);
      const tokens = Object.keys(this.monitors[groupName]);
      const sessions = (typeof this.testSessions[groupName] !== 'undefined') ?
        Object.values(this.testSessions[groupName]) :
        [];
      this.websocketGateway.broadcastToRegistered(tokens, 'test-sessions', sessions);
    }
  }

  addMonitor(monitor: Monitor): void {
    monitor.groups.forEach((group: string) => {
      if (typeof this.monitors[group] === 'undefined') {
        this.monitors[group] = {};
      }
      if (typeof this.testSessions[group] === 'undefined') {
        this.testSessions[group] = {};
      }
      this.monitors[group][monitor.token] = monitor;
    });
  }

  removeMonitor(monitorToken: string): void {
    this.logger.log(`remove monitor: ${monitorToken}`);

    Object.keys(this.monitors).forEach((group: string) => {
      if (typeof this.monitors[group][monitorToken] !== 'undefined') {
        delete this.monitors[group][monitorToken];

        if (Object.keys(this.monitors[group]).length === 0) {
          delete this.testSessions[group];
        }
      }
    });

    this.websocketGateway.disconnectClient(monitorToken);
  }

  getMonitors(): Monitor[] {
    return Object.values(this.monitors)
      .reduce(
        (allMonitors: Monitor[], groupMonitors: { [g: string]: Monitor }): Monitor[] => allMonitors
          .concat(Object.values(groupMonitors)), []
      )
      .filter((v: Monitor, i: number, a: Monitor[]) => a.indexOf(v) === i);
  }

  getTestSessions(): TestSessionChange[] {
    return Object.values(this.testSessions)
      .reduce(
        // eslint-disable-next-line max-len
        (allTestSessions: TestSessionChange[], groupTestSessions: { [g: string]: TestSessionChange }): TestSessionChange[] => allTestSessions.concat(Object.values(groupTestSessions)),
        []
      );
  }

  getClientTokens(): string[] {
    return this.websocketGateway.getClientTokens();
  }

  clean(): void {
    this.monitors = {};
    this.testSessions = {};
  }
}
