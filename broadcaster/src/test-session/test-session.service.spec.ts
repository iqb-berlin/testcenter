/* eslint-disable @typescript-eslint/dot-notation */
import { Test, TestingModule } from '@nestjs/testing';
import { TestSessionChange } from 'testcenter-common/interfaces/test-session-change.interface';
import { TestSessionService } from './test-session.service';
import { Monitor } from '../monitor/monitor.interface';
import { WebsocketGateway } from '../common/websocket.gateway';

let testSessionService : TestSessionService;

const mockMonitor1 : Monitor = {
  token: 'monitorToken1',
  groups: ['Gruppe1', 'TestakerGroup1', 'Gruppe2']
};

const mockMonitor2 : Monitor = {
  token: 'monitorToken2',
  groups: ['Gruppe1', 'TestakerGroup1', 'Gruppe2']
};

const mockMonitor3 : Monitor = {
  token: 'monitorToken3',
  groups: ['Gruppe3', 'Gruppe5']
};

describe('TestSessionService: add and remove monitors', () => {
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestSessionService, WebsocketGateway]
    }).compile();

    testSessionService = module.get<TestSessionService>(TestSessionService);
  });

  it('should be defined', () => {
    expect(testSessionService).toBeDefined();
  });

  it('should add monitors', () => {
    testSessionService.addMonitor(mockMonitor1);
    expect(testSessionService['monitors']['Gruppe1']['monitorToken1']).toStrictEqual(mockMonitor1);
    expect(testSessionService['monitors']['TestakerGroup1']['monitorToken1']).toStrictEqual(mockMonitor1);
    expect(testSessionService['monitors']['Gruppe2']['monitorToken1']).toStrictEqual(mockMonitor1);
    expect(testSessionService['testSessions']['Gruppe1']).toStrictEqual({});
    expect(testSessionService['testSessions']['TestakerGroup1']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe2']).toStrictEqual({});
  });

  it('should remove monitor (resulting in empty monitor list)', () => {
    const spyLogger = jest.spyOn(testSessionService['logger'], 'log');
    const spyDisconnectClient = jest.spyOn(testSessionService['websocketGateway'], 'disconnectClient');

    testSessionService.addMonitor(mockMonitor1);
    testSessionService.removeMonitor(mockMonitor1.token);

    expect(spyLogger).toHaveBeenCalled();
    expect(testSessionService['monitors']['Gruppe1']).toStrictEqual({});
    expect(testSessionService['monitors']['TestakerGroup1']).toStrictEqual({});
    expect(testSessionService['monitors']['Gruppe2']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe1']).toBeUndefined();
    expect(testSessionService['testSessions']['TestakerGroup1']).toBeUndefined();
    expect(testSessionService['testSessions']['Gruppe2']).toBeUndefined();
    expect(spyDisconnectClient).toHaveBeenCalled();
  });

  it('should remove monitor (not empty monitor list)', () => {
    const spyLogger = jest.spyOn(testSessionService['logger'], 'log');
    const spyDisconnectClient = jest.spyOn(testSessionService['websocketGateway'], 'disconnectClient');

    testSessionService.addMonitor(mockMonitor1);
    testSessionService.addMonitor(mockMonitor2);
    testSessionService.removeMonitor(mockMonitor1.token);

    expect(spyLogger).toHaveBeenCalled();
    expect(testSessionService['monitors']['Gruppe1']['monitorToken1']).toBeUndefined();
    expect(testSessionService['monitors']['TestakerGroup1']['monitorToken1']).toBeUndefined();
    expect(testSessionService['monitors']['Gruppe2']['monitorToken1']).toBeUndefined();
    expect(testSessionService['monitors']['Gruppe1']['monitorToken2']).toStrictEqual(mockMonitor2);
    expect(testSessionService['monitors']['TestakerGroup1']['monitorToken2']).toStrictEqual(mockMonitor2);
    expect(testSessionService['monitors']['Gruppe2']['monitorToken2']).toStrictEqual(mockMonitor2);
    expect(testSessionService['testSessions']['Gruppe1']).toStrictEqual({});
    expect(testSessionService['testSessions']['TestakerGroup1']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe2']).toStrictEqual({});
    expect(spyDisconnectClient).toHaveBeenCalled();
  });

  it('should remove monitor (two distinct monitors)', () => {
    const spyLogger = jest.spyOn(testSessionService['logger'], 'log');
    const spyDisconnectClient = jest.spyOn(testSessionService['websocketGateway'], 'disconnectClient');

    testSessionService.addMonitor(mockMonitor1);
    testSessionService.addMonitor(mockMonitor3);
    testSessionService.removeMonitor(mockMonitor1.token);

    expect(spyLogger).toHaveBeenCalled();
    expect(testSessionService['monitors']['Gruppe1']['monitorToken1']).toBeUndefined();
    expect(testSessionService['monitors']['TestakerGroup1']['monitorToken1']).toBeUndefined();
    expect(testSessionService['monitors']['Gruppe2']['monitorToken1']).toBeUndefined();
    expect(testSessionService['monitors']['Gruppe3']['monitorToken3']).toStrictEqual(mockMonitor3);
    expect(testSessionService['monitors']['Gruppe5']['monitorToken3']).toStrictEqual(mockMonitor3);
    expect(testSessionService['testSessions']['Gruppe1']).toBeUndefined();
    expect(testSessionService['testSessions']['TestakerGroup1']).toBeUndefined();
    expect(testSessionService['testSessions']['Gruppe2']).toBeUndefined();
    expect(testSessionService['testSessions']['Gruppe3']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe5']).toStrictEqual({});
    expect(spyDisconnectClient).toHaveBeenCalled();
  });

  it('should call getClientTokens', () => {
    const spyGetClientTokens = jest.spyOn(testSessionService['websocketGateway'], 'getClientTokens');
    testSessionService.getClientTokens();
    expect(spyGetClientTokens).toHaveBeenCalled();
  });
});

describe('testSessionService: get and clear all monitors', () => {
  const monitorList : Monitor[] = [mockMonitor1, mockMonitor2, mockMonitor3];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestSessionService, WebsocketGateway]
    }).compile();

    testSessionService = module.get<TestSessionService>(TestSessionService);

    testSessionService.addMonitor(mockMonitor1);
    testSessionService.addMonitor(mockMonitor2);
    testSessionService.addMonitor(mockMonitor3);
  });

  it('should return all monitors', () => {
    expect(testSessionService.getMonitors()).toStrictEqual(monitorList);
  });

  it('should clear all monitors and testSessions', () => {
    testSessionService.clean();
    expect(testSessionService['monitors']).toStrictEqual({});
    expect(testSessionService['testSessions']).toStrictEqual({});
  });
});

describe('testSessionService sessionChanges', () => {
  const mockSessionChange1 : TestSessionChange = {
    personId: 357,
    groupName: 'TestakerGroup1',
    testId: 381,
    personLabel: 'user2',
    groupLabel: 'TestakerGroup1',
    mode: 'run-hot-return',
    testState: {
      CONTROLLER: 'TERMINATED',
      CURRENT_UNIT_ID: 'Endunit',
      TESTLETS_CLEARED_CODE: '["Examples"], ["ExamplesOl"]',
      FOCUS: 'HAS',
      status: 'locked',
      old: 'old'
    },
    bookletName: 'BOOKLET1',
    unitName: 'Endunit',
    unitState: {
      PLAYER: 'RUNNING', RESPONSE_PROGRESS: 'none', PRESENTATION_PROGRESS: 'complete', OLD_STATE: 'old state'
    },
    timestamp: 1630051624
  };
  const mockSessionChange1Updated : TestSessionChange = {
    personId: 357,
    groupName: 'TestakerGroup1',
    testId: 381,
    personLabel: 'user2',
    groupLabel: 'TestakerGroup1',
    mode: 'run-hot-return',
    testState: {
      CONTROLLER: 'RUNNING',
      CURRENT_UNIT_ID: 'Endunit',
      TESTLETS_CLEARED_CODE: '["Examples"], ["Examples2"]',
      FOCUS: 'HAS',
      status: 'not_locked',
      new: 'new'
    },
    bookletName: 'BOOKLET2',
    unitName: 'Endunit',
    unitState: {
      PLAYER: 'RUNNING', RESPONSE_PROGRESS: 'none', PRESENTATION_PROGRESS: 'complete', NEW_STATE: 'new state'
    },
    timestamp: 1630051874
  };
  const mockSessionChangeNoMonitor : TestSessionChange = {
    personId: 9,
    groupName: 'Gruppe6',
    testId: 10,
    personLabel: 'valid Personlabel',
    groupLabel: 'Gruppe1',
    mode: 'run-hot-return',
    testState: {
      CONTROLLER: 'TERMINATED', CURRENT_UNIT_ID: 'FB_unit3', FOCUS: 'HAS', status: 'locked'
    },
    bookletName: 'BOOKLET_VERSION1',
    unitName: 'FB_unit3',
    unitState: { PLAYER: 'RUNNING', PRESENTATION_PROGRESS: 'complete', RESPONSE_PROGRESS: 'some' },
    timestamp: 1630051624
  };
  const mockSessionChange2 : TestSessionChange = {
    personId: 6,
    groupName: 'Gruppe2',
    testId: 7,
    personLabel: 'V212',
    groupLabel: 'Gruppe2',
    mode: 'run-hot-return',
    testState: {
      CONTROLLER: 'TERMINATED', CURRENT_UNIT_ID: 'FB_unit3', FOCUS: 'HAS', status: 'locked'
    },
    bookletName: 'BOOKLET_VERSION2',
    unitName: 'FB_unit3',
    unitState: { PLAYER: 'RUNNING', PRESENTATION_PROGRESS: 'complete', RESPONSE_PROGRESS: 'some' },
    timestamp: 1630051624
  };
  const mockSessionChange3 : TestSessionChange = {
    personId: 7,
    groupName: 'Gruppe3',
    testId: 8,
    personLabel: 'V315',
    groupLabel: 'Gruppe3',
    mode: 'run-hot-return',
    testState: {
      CONTROLLER: 'TERMINATED', CURRENT_UNIT_ID: 'FB_unit3', FOCUS: 'HAS', status: 'locked'
    },
    bookletName: 'BOOKLET_VERSION3',
    unitName: 'FB_unit3',
    unitState: { PLAYER: 'RUNNING', PRESENTATION_PROGRESS: 'complete', RESPONSE_PROGRESS: 'some' },
    timestamp: 1630051624
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestSessionService, WebsocketGateway]
    }).compile();

    testSessionService = module.get<TestSessionService>(TestSessionService);
    testSessionService.addMonitor(mockMonitor1);
    testSessionService.addMonitor(mockMonitor3);
  });

  it('should return early (applySessioChange)', () => {
    testSessionService.applySessionChange(mockSessionChangeNoMonitor);
    expect(testSessionService['testSessions']['Testakergroup1']).toBeUndefined();
    expect(testSessionService['testSessions']['Gruppe2']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe3']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe5']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe6']).toBeUndefined();
  });

  it('should create session entry', () => {
    testSessionService.applySessionChange(mockSessionChange1);
    expect(testSessionService['testSessions']['TestakerGroup1']['381']).toStrictEqual(mockSessionChange1);
    expect(testSessionService['testSessions']['Gruppe2']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe3']).toStrictEqual({});
    expect(testSessionService['testSessions']['Gruppe5']).toStrictEqual({});
  });

  it('should update a session entry (same unit name)', () => {
    const expectedSession : TestSessionChange = {
      personId: 357,
      groupName: 'TestakerGroup1',
      testId: 381,
      personLabel: 'user2',
      groupLabel: 'TestakerGroup1',
      mode: 'run-hot-return',
      testState: {
        CONTROLLER: 'RUNNING',
        CURRENT_UNIT_ID: 'Endunit',
        TESTLETS_CLEARED_CODE: '["Examples"], ["Examples2"]',
        FOCUS: 'HAS',
        status: 'not_locked',
        old: 'old',
        new: 'new'
      },
      bookletName: 'BOOKLET2',
      unitName: 'Endunit',
      unitState: {
        PLAYER: 'RUNNING',
        RESPONSE_PROGRESS: 'none',
        PRESENTATION_PROGRESS: 'complete',
        OLD_STATE: 'old state',
        NEW_STATE: 'new state'
      },
      timestamp: 1630051874
    };

    testSessionService.applySessionChange(mockSessionChange1);
    testSessionService.applySessionChange(mockSessionChange1Updated);
    expect(testSessionService['testSessions']['TestakerGroup1']['381']).toStrictEqual(expectedSession);
    expect(testSessionService['testSessions']['Group1']).toBeUndefined();
    expect(testSessionService['testSessions']['Group2']).toBeUndefined();
    expect(testSessionService['testSessions']['Group3']).toBeUndefined();
    expect(testSessionService['testSessions']['Group5']).toBeUndefined();
  });

  it('should update a session entry (different unit name)', () => {
    mockSessionChange1Updated.unitName = 'Testunit';
    mockSessionChange1Updated.unitState = {
      PLAYER: 'RUNNING', PRESENTATION_PROGRESS: 'complete'
    };
    const expectedSession : TestSessionChange = {
      personId: 357,
      groupName: 'TestakerGroup1',
      testId: 381,
      personLabel: 'user2',
      groupLabel: 'TestakerGroup1',
      mode: 'run-hot-return',
      testState: {
        CONTROLLER: 'RUNNING',
        CURRENT_UNIT_ID: 'Endunit',
        TESTLETS_CLEARED_CODE: '["Examples"], ["Examples2"]',
        FOCUS: 'HAS',
        status: 'not_locked',
        old: 'old',
        new: 'new'
      },
      bookletName: 'BOOKLET2',
      unitName: 'Testunit',
      unitState: {
        PLAYER: 'RUNNING', PRESENTATION_PROGRESS: 'complete'
      },
      timestamp: 1630051874
    };

    testSessionService.applySessionChange(mockSessionChange1);
    testSessionService.applySessionChange(mockSessionChange1Updated);
    expect(testSessionService['testSessions']['TestakerGroup1']['381']).toStrictEqual(expectedSession);
    expect(testSessionService['testSessions']['Group1']).toBeUndefined();
    expect(testSessionService['testSessions']['Group2']).toBeUndefined();
    expect(testSessionService['testSessions']['Group3']).toBeUndefined();
    expect(testSessionService['testSessions']['Group5']).toBeUndefined();
  });

  it('should return an array of sessionChanges', () => {
    const expectedTestSessions : TestSessionChange[] =
    [mockSessionChange1, mockSessionChange2, mockSessionChange3];

    testSessionService.applySessionChange(mockSessionChange1);
    testSessionService.applySessionChange(mockSessionChange2);
    testSessionService.applySessionChange(mockSessionChange3);
    expect(testSessionService.getTestSessions()).toStrictEqual(expectedTestSessions);
  });
});
