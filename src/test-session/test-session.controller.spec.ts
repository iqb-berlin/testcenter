import { Test, TestingModule } from '@nestjs/testing';
import { TestSessionController } from './test-session.controller'
import { TestSessionService } from '../test-session/test-session.service';
import { SessionChange } from './session-change.interface';
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

let testSessionController : TestSessionController;

describe('TestSessionController Post', () => {
    const mockTestSessionservice = {
        applySessionChange : jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TestSessionController],
            providers: [TestSessionService],
        }).overrideProvider(TestSessionService).useValue(mockTestSessionservice).compile();

        testSessionController = module.get<TestSessionController>(TestSessionController);
    });

    it('should should be defined', () => {
        expect(testSessionController).toBeDefined();
    });

    it('should throw not session data', () => {
        const mockRequest = {
            body : {
                personId : 5,
                timestamp : 12.2
            }
        } as Request;

        expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow(HttpException);
        expect(() => testSessionController.pushSessionChange(mockRequest)).toThrow('not session data');
    });

    it('should not throw any errors', () => {
        const mockSessionChange : SessionChange = {
            personId : 3,
            groupName : "group string",
            testState: {},
            testId: 4,
            unitState: {},
            timestamp: 12.30
        };

        const mockRequest = {
            body : mockSessionChange
        } as Request;

        expect(testSessionController.pushSessionChange(mockRequest)).toBeUndefined();
    })
});

describe('testSessionController Get', () => {
    const mockSessionChange1 : SessionChange = {
        personId : 3,
        groupName : "group string",
        testState: {},
        testId: 4,
        unitState: {},
        timestamp: 12.30
    };

    const mockSessionChange2 : SessionChange = {
        personId : 6,
        groupName : "group string",
        testState: {},
        testId: 19,
        unitState: {},
        timestamp: 13.30
    };

    const mockSessionChange4 : SessionChange = {
        personId : 123,
        groupName : "group string",
        testState: {},
        testId: 19,
        unitState: {},
        timestamp: 13.30
    };

    const sessionChangesList = [mockSessionChange1, mockSessionChange2, mockSessionChange4];

    const mockTestSessionservice = {
        getTestSessions : jest.fn(() => {
            return sessionChangesList;
        })
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TestSessionController],
            providers: [TestSessionService],
        }).overrideProvider(TestSessionService).useValue(mockTestSessionservice).compile();

        testSessionController = module.get<TestSessionController>(TestSessionController);
    });

    it('should return a list of sessionChanges', () => {
        expect(testSessionController.getTestSessions()).toEqual(sessionChangesList);
    });
});