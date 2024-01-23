import { TestSessionChange } from 'testcenter-common/interfaces/test-session-change.interface';
import {
  BookletDef, CommandResponse, TestSession, TestSessionData, TestSessionSetStats
} from './group-monitor.interfaces';
import { TestSessionUtil } from './test-session/test-session.util';
import { BookletConfig } from '../shared/classes/booklet-config.class';

// labels are: {global index}-{ancestor index}-{local index}
export const unitTestExampleBooklets: { [name: string]: Booklet } = {
  example_booklet_1: {
    species: 'example-species-1',
    config: new BookletConfig(),
    metadata: {
      id: '1',
      label: 'Label 1',
      description: 'Description 1'
    },
    units: {
      id: 'root',
      label: 'Root',
      descendantCount: 10,
      children: [
        { id: 'unit-1', label: '0-0-0', labelShort: 'unit' },
        {
          id: 'zara',
          label: 'Testlet-0',
          descendantCount: 6,
          blockId: 'block-1',
          children: []
        },
        { id: 'unit-2', label: '1-1-1', labelShort: 'unit' },
        {
          id: 'alf',
          label: 'Testlet-1',
          descendantCount: 4,
          blockId: 'block-2',
          children: [
            { id: 'unit-3', label: '2-0-0', labelShort: 'unit' },
            {
              id: 'ben',
              label: 'Testlet-2',
              descendantCount: 3,
              children: [
                { id: 'unit-4', label: '3-1-0', labelShort: 'unit' },
                {
                  id: 'cara',
                  label: 'Testlet-3',
                  descendantCount: 2,
                  children: []
                },
                { id: 'unit-5', label: '4-2-1', labelShort: 'unit' },
                {
                  id: 'dolf',
                  label: 'Testlet-4',
                  descendantCount: 1,
                  children: [
                    { id: 'unit-6', label: '5-3-0', labelShort: 'unit' }
                  ]
                }
              ]
            },
            { id: 'unit-7', label: '6-4-1', labelShort: 'unit' }
          ]
        },
        { id: 'unit-8', label: '7-2-2', labelShort: 'unit' },
        {
          id: 'ellie',
          label: 'Testlet-5',
          descendantCount: 2,
          blockId: 'block-3',
          children: [
            { id: 'unit-9', label: '8-0-0', labelShort: 'unit' },
            {
              id: 'fred',
              label: 'Testlet-6',
              descendantCount: 1,
              children: [
                { id: 'unit-10', label: '9-1-0', labelShort: 'unit' }
              ]
            }
          ]
        }
      ]
    }
  },
  example_booklet_2: {
    species: 'example-species-2',
    config: new BookletConfig(),
    metadata: {
      id: 'Booklet-2',
      label: 'Label 2',
      description: 'Description 2'
    },
    units: {
      id: 'root',
      label: 'Root',
      descendantCount: 4,
      children: [
        {
          id: 'zoe',
          label: 'Testlet-0',
          descendantCount: 3,
          blockId: 'block-1',
          children: [
            {
              id: 'anton',
              label: 'Testlet-1',
              descendantCount: 2,
              children: [
                {
                  id: 'berta',
                  label: 'Testlet-2',
                  descendantCount: 1,
                  children: [
                    { id: 'unit-1', label: '0-0-0', labelShort: 'unit' }
                  ]
                }
              ]
            }
          ]
        },
        { id: 'unit-2', label: '1-1-1', labelShort: 'unit' },
        {
          id: 'dirk',
          label: 'Testlet-3',
          descendantCount: 0,
          blockId: 'block-2',
          children: []
        }
      ]
    }
  },
  example_booklet_3: {
    species: 'example-species-1',
    config: new BookletConfig(),
    metadata: {
      id: '3',
      label: 'Label 3',
      description: 'Another Booklet of species 1!'
    },
    units: {
      id: 'root',
      label: 'Root',
      descendantCount: 1,
      children: [
        {
          id: 'zara',
          label: 'Testlet-0',
          descendantCount: 0,
          blockId: 'block-1',
          children: []
        },
        {
          id: 'alf',
          label: 'Testlet-1',
          descendantCount: 1,
          blockId: 'block-2',
          children: [
            { id: 'unit-1', label: '0-0-0', labelShort: 'unit' }
          ]
        }
      ]
    }
  }
};

export const unitTestExampleSessions: TestSession[] = [
  {
    personId: 1,
    personLabel: 'Person 1',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 1,
    bookletName: 'example_booklet_1',
    testState: {
      CONTROLLER: 'RUNNING',
      status: 'running'
    },
    unitName: 'unit-10',
    unitState: {},
    timestamp: 10000500
  },
  {
    personId: 1,
    personLabel: 'Person 1',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 2,
    bookletName: 'example_booklet_2',
    testState: {
      CONTROLLER: 'PAUSED',
      status: 'running'
    },
    unitName: 'unit-1',
    unitState: {},
    timestamp: 10000300
  },
  <TestSessionChange>{
    personId: 2,
    personLabel: 'Person 2',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-restart',
    testId: 3,
    bookletName: 'this_does_not_exist',
    testState: {
      status: 'pending'
    },
    unitName: 'unit',
    unitState: {},
    timestamp: 10000000
  }
]
  .map(session => TestSessionUtil.analyzeTestSession(
    session, unitTestExampleBooklets[session.bookletName ?? ''] || { error: 'missing-file', species: null }
  ));

export const additionalUnitTestExampleSessions: TestSession[] = [
  <TestSessionData>{
    personId: 33,
    personLabel: 'Person 33',
    groupName: 'group-2',
    groupLabel: 'Group 2',
    mode: 'run-hot-return',
    testId: 33,
    bookletName: 'example_booklet_1',
    testState: {
      CONTROLLER: 'RUNNING',
      status: 'running'
    },
    unitName: 'unit-7',
    unitState: {},
    timestamp: 10000330
  },
  <TestSessionData>{
    personId: 34,
    personLabel: 'Person 33',
    groupName: 'group-2',
    groupLabel: 'Group 2',
    mode: 'run-hot-return',
    testId: 34,
    bookletName: 'example_booklet_3',
    testState: {
      CONTROLLER: 'RUNNING',
      status: 'running'
    },
    unitName: 'unit-7',
    unitState: {},
    timestamp: 10000340
  }
]
  .map(session => TestSessionUtil.analyzeTestSession(
    session, unitTestExampleBooklets[session.bookletName ?? ''] || { error: 'missing-file', species: null }
  ));

export const unitTestSessionsStats: TestSessionSetStats = {
  all: false,
  number: 0,
  differentBookletSpecies: 0,
  differentBooklets: 0,
  paused: 0,
  locked: 0
};

export const unitTestCheckedStats: TestSessionSetStats = {
  all: false,
  number: 0,
  differentBookletSpecies: 0,
  differentBooklets: 0,
  paused: 0,
  locked: 0
};

export const unitTestCommandResponse: CommandResponse = {
  commandType: 'any',
  testIds: [0]
};
