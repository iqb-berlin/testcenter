import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { HttpException } from '@nestjs/common';
import { TestSessionChange } from 'testcenter-common/interfaces/test-session-change.interface';
import { TestSessionController } from './test-session.controller';
import { TestSessionService } from './test-session.service';

let testSessionController : TestSessionController;

describe('TestSessionController Post', () => {
  const mockTestSessionservice = {
    applySessionChange: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestSessionController],
      providers: [TestSessionService]
    }).overrideProvider(TestSessionService).useValue(mockTestSessionservice).compile();

    testSessionController = module.get<TestSessionController>(TestSessionController);
  });

  it('should should be defined', () => {
    expect(testSessionController).toBeDefined();
  });

  it('should throw not session data (no groupName property)', () => {
    const mockRequest = {
      body: {
        personId: 5,
        timestamp: 12.2
      }
    } as Request;

    expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow(HttpException);
    expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow('not session data');
  });

  it('should throw not session data (no timestamp property)', () => {
    const mockRequest = {
      body: {
        personId: 5,
        groupName: 'groupString'
      }
    } as Request;

    expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow(HttpException);
    expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow('not session data');
  });

  it('should throw not session data (no personId property)', () => {
    const mockRequest = {
      body: {
        groupName: 'groupString',
        timestamp: 12.30
      }
    } as Request;

    expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow(HttpException);
    expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow('not session data');
  });

  it('should not throw any errors (happy path)', () => {
    const mockSessionChange : TestSessionChange = {
      personId: 3,
      groupName: 'group string',
      personLabel: 'valid personLabel',
      testState: {},
      testId: 4,
      unitState: {},
      timestamp: 12.30
    };

    const mockRequest = {
      body: mockSessionChange
    } as Request;

    expect(testSessionController.pushSessionChange(mockRequest)).toBeUndefined();
  });
});

describe('testSessionController Get', () => {
  const mockSessionChange1 : TestSessionChange = {
    personId: 3,
    groupName: 'group string',
    personLabel: 'valid personLabel1',
    testState: {},
    testId: 4,
    unitState: {},
    timestamp: 12.30
  };

  const mockSessionChange2 : TestSessionChange = {
    personId: 6,
    groupName: 'group string',
    personLabel: 'valid personLabel2',
    testState: {},
    testId: 19,
    unitState: {},
    timestamp: 13.30
  };

  const mockSessionChange4 : TestSessionChange = {
    personId: 123,
    groupName: 'group string',
    personLabel: 'valid personLabel4',
    testState: {},
    testId: 19,
    unitState: {},
    timestamp: 13.30
  };

  const sessionChangesList = [mockSessionChange1, mockSessionChange2, mockSessionChange4];

  const mockTestSessionservice = {
    getTestSessions: jest.fn(() => sessionChangesList)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestSessionController],
      providers: [TestSessionService]
    }).overrideProvider(TestSessionService).useValue(mockTestSessionservice).compile();

    testSessionController = module.get<TestSessionController>(TestSessionController);
  });

  it('should return a list of sessionChanges', () => {
    expect(testSessionController.getTestSessions()).toStrictEqual(sessionChangesList);
  });
});
