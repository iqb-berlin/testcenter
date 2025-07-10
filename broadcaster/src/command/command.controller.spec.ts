/* eslint-disable @typescript-eslint/dot-notation */
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { HttpException } from '@nestjs/common';
import { CommandController } from './command.controller';
import { TesteeService } from '../testee/testee.service';

describe('CommandControler', () => {
  let commandController: CommandController;

  const mockTesteeService = {
    broadcastCommandToTestees: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommandController],
      providers: [TesteeService]
    })
      .overrideProvider(TesteeService)
      .useValue(mockTesteeService)
      .compile();

    commandController = module.get<CommandController>(CommandController);
  });

  it('should be defined', () => {
    expect(commandController).toBeDefined();
  });

  it('should throw invalid command data (no command property)', () => {
    const mockNoCommand = {
      body: {
        testIds: [1, 2, 3],
        arguments: 'some arguments',
        timestamp: new Date()
      }
    } as Request;

    expect(() => commandController.postCommand(mockNoCommand)).toThrow(HttpException);
    expect(() => commandController.postCommand(mockNoCommand)).toThrow('invalid command data');
  });

  it('should throw invalid command data (malformed command)', () => {
    const mockMalformedRequest = {
      body: {
        command: {
          id: 12
        }
      }
    } as Request;

    expect(() => commandController.postCommand(mockMalformedRequest)).toThrow(HttpException);
    expect(() => commandController.postCommand(mockMalformedRequest)).toThrow('invalid command data');
  });

  it('should throw no testIds given (no testIds property)', () => {
    const mockNoTestIDs = {
      body: {
        command: {
          keyword: 'pause',
          id: 12,
          arguments: 'some arguments',
          timestamp: new Date()
        }
      }
    } as Request;

    expect(() => commandController.postCommand(mockNoTestIDs)).toThrow(HttpException);
    expect(() => commandController.postCommand(mockNoTestIDs)).toThrow('no testIds given');
  });

  it('should throw no testIds given (array test)', () => {
    const mockNoArrayTestID = {
      body: {
        command: {
          keyword: 'pause',
          id: 12,
          arguments: 'some arguments',
          timestamp: new Date()
        },
        testIds: 4
      }
    } as Request;

    expect(() => commandController.postCommand(mockNoArrayTestID)).toThrow(HttpException);
    expect(() => commandController.postCommand(mockNoArrayTestID)).toThrow('no testIds given');
  });

  it('Should not throw any errors (happy path)', () => {
    const spyLogger = jest.spyOn(commandController['logger'], 'log');
    const mockValidRequest = {
      body: {
        command: {
          keyword: 'pause',
          id: 'string id',
          arguments: ['arguments1', 'argument2'],
          timestamp: 12
        },
        testIds: [5]
      }
    } as Request;

    expect(commandController.postCommand(mockValidRequest)).toBeUndefined();
    expect(spyLogger).toHaveBeenCalled();
    expect(mockTesteeService.broadcastCommandToTestees)
      .toHaveBeenCalledWith(mockValidRequest.body.command, mockValidRequest.body.testIds);
  });
});
