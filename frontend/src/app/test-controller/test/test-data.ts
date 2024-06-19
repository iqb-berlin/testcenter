import { CodingScheme } from '@iqb/responses';
import {
  TestDataResourcesMap, Testlet, TestStateKey, Unit, UnitData
} from '../interfaces/test-controller.interfaces';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../../shared/shared.module';
import { WatcherLogEntry } from './watcher.util';
import { perSequenceId } from './unit-test.util';

export const TestBookletXML = `<Booklet>
  <Metadata>
    <Id>BookletId</Id>
    <Label>Label</Label>
  </Metadata>

  <BookletConfig>
    <Config key="force_presentation_complete">ON</Config>
    <Config key="force_response_complete">OFF</Config>
    <Config key="loading_mode">EAGER</Config>
  </BookletConfig>

  <Units>
    <Restrictions>
      <DenyNavigationOnIncomplete presentation="OFF" response="ON"/>
      <TimeMax minutes="10" />
    </Restrictions>
    <Unit id="u1" label="l" />
    <Testlet id="t1">
     <Restrictions>
       <CodeToEnter code="d" />
       <TimeMax minutes="5" />
     </Restrictions>
     <Unit id="u2" label="l" />
     <Testlet id="t2">
       <Restrictions>
         <CodeToEnter code="d" />
         <TimeMax minutes="3" />
         <DenyNavigationOnIncomplete presentation="ON" response="OFF"/>
       </Restrictions>
       <Unit id="u3" label="l" />
     </Testlet>
     <Unit id="u4" label="l" />
    </Testlet>
    <Unit id="u5" label="l" />
  </Units>
</Booklet>`;

export const TestBookletXmlVariants = {
  withLoadingModeEager: TestBookletXML,
  withLoadingModeLazy: TestBookletXML.replace('key="loading_mode">EAGER', 'key="loading_mode">LAZY'),
  withMissingUnit: TestBookletXML.replace('<Unit id="u2"', '<Unit id="MISSING"'),
  withBrokenBooklet: 'Broken < stuff',
  withMissingPlayer: TestBookletXML,
  withMissingUnitContent: TestBookletXML
};

export const TestUnits: { [unitId: string]: UnitData } = {
  u1: {
    dataParts: { all: 'data from a previous session' },
    state: {},
    definition: 'the unit (1) definition itself',
    unitResponseType: 'the-data-type'
  },
  u2: {
    dataParts: { all: 'data from a previous session' },
    state: {
      PRESENTATION_PROGRESS: 'some',
      CURRENT_PAGE_ID: '1',
      CURRENT_PAGE_NR: '1'
    },
    definition: '',
    unitResponseType: 'the-data-type'
  },
  u3: {
    dataParts: { all: 'data from a previous session' },
    state: {
      RESPONSE_PROGRESS: 'complete'
    },
    definition: '',
    unitResponseType: 'the-data-type'
  },
  u4: {
    dataParts: { all: 'data from a previous session' },
    state: {
      CURRENT_PAGE_ID: '2'
    },
    definition: 'the unit (4) definition itself',
    unitResponseType: 'the-data-type'
  },
  u5: {
    dataParts: { all: 'data from a previous session' },
    state: {},
    definition: 'the unit (5) definition itself',
    unitResponseType: 'the-data-type'
  }
};

export const TestPlayers = {
  'Resource/A-PLAYER.HTML': 'a player',
  'Resource/ANOTHER-PLAYER.HTML': 'another player',
  'Resource/A-PLAYER-2.HTML': 'a player, but version 2'
};

export const TestExternalUnitContents = {
  'Resource/test-unit-content-u2.voud': 'the unit (2) definition',
  'Resource/test-unit-content-u3.voud': 'the unit (3) definition'
};

export const TestResources: TestDataResourcesMap = {
  U1: {
    usesPlayer: ['Resource/A-PLAYER.HTML']
  },
  U2: {
    usesPlayer: ['Resource/ANOTHER-PLAYER.HTML'],
    isDefinedBy: ['Resource/test-unit-content-u2.voud']
  },
  U3: {
    usesPlayer: ['Resource/A-PLAYER-2.HTML'],
    isDefinedBy: ['Resource/test-unit-content-u3.voud']
  },
  U4: {
    usesPlayer: ['Resource/A-PLAYER.HTML']
  },
  U5: {
    usesPlayer: ['Resource/A-PLAYER.HTML']
  }
};

export const AllTestResources = {
  ...TestPlayers,
  ...TestExternalUnitContents
};

export const TestUnitDefinitionsPerSequenceId = Object.keys(TestUnits)
  .map(unidId => {
    const externalDefinition = TestResources[unidId.toUpperCase()].isDefinedBy;
    if (externalDefinition) {
      return TestExternalUnitContents[externalDefinition[0] as keyof typeof TestExternalUnitContents];
    }
    return TestUnits[unidId].definition;
  })
  .reduce(perSequenceId, {});

export const TestUnitStateDataParts = Object.values(TestUnits)
  .map(unitDef => unitDef.dataParts)
  .reduce(perSequenceId, {});

export const TestUnitPresentationProgressStates = Object.values(TestUnits)
  .map(unitDef => unitDef.state.PRESENTATION_PROGRESS)
  .reduce(perSequenceId, {});

export const TestUnitResponseProgressStates = Object.values(TestUnits)
  .map(unitDef => unitDef.state.RESPONSE_PROGRESS)
  .reduce(perSequenceId, {});

export const TestUnitStateCurrentPages = Object.values(TestUnits)
  .map(unitDef => unitDef.state.CURRENT_PAGE_ID)
  .reduce(perSequenceId, {});

export const TestTestState: { [k in TestStateKey]?: string } = {
  CURRENT_UNIT_ID: 'u3'
};

const testlets: { [ key: string]: Testlet } = {
  root: {
    id: 'BookletId',
    label: 'Label',
    locks: {
      condition: false,
      time: false,
      code: false,
      afterLeave: false
    },
    locked: null,
    timerId: 'timer-1',
    firstUnsatisfiedCondition: -1,
    maxTimeLeave: 'confirm',
    restrictions: {
      denyNavigationOnIncomplete: {
        presentation: 'OFF',
        response: 'ON'
      },
      if: []
    },
    blockLabel: '',
    children: []
  },
  t1: {
    id: 't1',
    label: 'Label 1',
    locks: {
      condition: false,
      time: false,
      code: false,
      afterLeave: false
    },
    locked: null,
    timerId: 'timer-1',
    firstUnsatisfiedCondition: -1,
    maxTimeLeave: 'confirm',
    restrictions: {
      denyNavigationOnIncomplete: {
        presentation: 'OFF',
        response: 'ON'
      },
      if: [],
      codeToEnter: {
        code: 'D',
        message: ''
      },
      timeMax: {
        minutes: 5,
        leave: 'confirm'
      }
    },
    blockLabel: '',
    children: []
  },
  t2: {
    id: 't2',
    label: 'Label 2',
    locks: {
      condition: false,
      time: false,
      code: false,
      afterLeave: false
    },
    locked: null,
    timerId: 'timer-2',
    firstUnsatisfiedCondition: -1,
    maxTimeLeave: 'confirm',
    restrictions: {
      denyNavigationOnIncomplete: {
        presentation: 'OFF',
        response: 'ON'
      },
      if: [],
      codeToEnter: {
        code: 'D',
        message: ''
      },
      timeMax: {
        minutes: 3,
        leave: 'confirm'
      }
    },
    blockLabel: '',
    children: []
  }
};

const units: { [key: string]: Unit } = {
  u1: {
    id: 'u1',
    alias: 'u1',
    label: 'Unit-1',
    labelShort: 'U1',
    sequenceId: 1,
    parent: testlets.root,
    localIndex: 1,
    playerId: 'A-PLAYER',
    variables: {},
    baseVariableIds: [],
    playerFileName: 'Resource/A-PLAYER.HTML',
    scheme: new CodingScheme([]),
    responseType: '',
    definition: '',
    state: {},
    dataParts: {},
    loadingProgress: {},
    lockedAfterLeaving: false
  },
  u2: {
    id: 'u2',
    alias: 'u2',
    label: 'Unit-2',
    labelShort: 'U2',
    sequenceId: 2,
    parent: testlets.t1,
    localIndex: 1,
    playerId: 'ANOTHER-PLAYER',
    variables: {},
    baseVariableIds: [],
    playerFileName: 'Resource/ANOTHER-PLAYER.HTML',
    scheme: new CodingScheme([]),
    responseType: '',
    definition: '',
    state: {},
    dataParts: {},
    loadingProgress: {},
    lockedAfterLeaving: false
  },
  u3: {
    id: 'u3',
    alias: 'u3',
    label: 'Unit-3',
    labelShort: 'U3',
    sequenceId: 3,
    parent: testlets.t2,
    localIndex: 1,
    playerId: 'A-PLAYER-2',
    variables: {},
    baseVariableIds: [],
    playerFileName: 'Resource/A-PLAYER-2.HTML',
    scheme: new CodingScheme([]),
    responseType: '',
    definition: '',
    state: {},
    dataParts: {},
    loadingProgress: {},
    lockedAfterLeaving: false
  },
  u4: {
    id: 'u4',
    alias: 'u4',
    label: 'Unit-4',
    labelShort: 'U4',
    sequenceId: 4,
    parent: testlets.t2,
    localIndex: 1,
    playerId: 'A-PLAYER',
    variables: {},
    baseVariableIds: [],
    playerFileName: 'Resource/A-PLAYER.HTML',
    scheme: new CodingScheme([]),
    responseType: '',
    definition: '',
    state: {},
    dataParts: {},
    loadingProgress: {},
    lockedAfterLeaving: false
  },
  u5: {
    id: 'u5',
    alias: 'u5',
    label: 'Unit-5',
    labelShort: 'U5',
    sequenceId: 5,
    parent: testlets.root,
    localIndex: 1,
    playerId: 'A-PLAYER',
    variables: {},
    baseVariableIds: [],
    playerFileName: 'Resource/A-PLAYER.HTML',
    scheme: new CodingScheme([]),
    responseType: '',
    definition: '',
    state: {},
    dataParts: {},
    loadingProgress: {},
    lockedAfterLeaving: false
  }

};

testlets.root.children.push(units.u1, testlets.t1, units.u5);
testlets.t1.children.push(units.u2, testlets.t2);
testlets.t2.children.push(units.u3, units.u4);

export const TestBooklet = testlets.root;

export const TestBookletConfig = new BookletConfig();
TestBookletConfig.force_presentation_complete = 'ON';
TestBookletConfig.force_response_complete = 'OFF';
TestBookletConfig.loading_mode = 'EAGER';

export const TestLoadingProtocols: { [testId in keyof typeof TestBookletXmlVariants]: WatcherLogEntry[] } = {
  withLoadingModeLazy: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },

    // unit 1
    // 5 units, so each triplet of unit-player-content is worth 6.6% in the total progress.
    // total progress gets updated first , don't be confused
    { name: 'tcs.totalLoadingProgress', value: 6.666666666666667 }, // unit 1
    { name: 'tcs.setUnitLoadProgress$', value: [1] },
    { name: 'tcs.unitContentLoadProgress$[1]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // unit 1 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 16.666666666666664 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.333333333333332 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },

    // unit 2
    { name: 'tcs.totalLoadingProgress', value: 26.666666666666668 }, // unit 2
    { name: 'tcs.totalLoadingProgress', value: 26.666666666666668 }, // 0% of another player
    { name: 'tcs.totalLoadingProgress', value: 30 }, // 50% of another player
    { name: 'tcs.totalLoadingProgress', value: 31.666666666666664 }, // 75% of another-player
    { name: 'tcs.totalLoadingProgress', value: 33.33333333333333 }, // 100% of another-player
    { name: 'tcs.totalLoadingProgress', value: 33.33333333333333 }, // 100% of another-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/ANOTHER-PLAYER.HTML'] },

    // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // 0% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 43.333333333333336 }, // 50% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 45 }, // 75% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 46.666666666666664 }, // 100% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 46.666666666666664 }, // 100% of a-player-but-version-2 (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER-2.HTML'] },

    // unit 4
    { name: 'tcs.totalLoadingProgress', value: 53.333333333333336 }, // unit 4
    { name: 'tcs.setUnitLoadProgress$', value: [4] },
    { name: 'tcs.unitContentLoadProgress$[4]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 60 }, // unit 4 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 66.66666666666666 }, // unit 4 player (already loaded)

    // unit 5
    { name: 'tcs.totalLoadingProgress', value: 73.33333333333333 }, // unit 5
    { name: 'tcs.setUnitLoadProgress$', value: [5] },
    { name: 'tcs.unitContentLoadProgress$[5]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 80 }, // unit 5 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 86.66666666666667 }, // unit 5 player (already loaded)

    // queue external unit contents
    { name: 'tcs.setUnitLoadProgress$', value: [3] },
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 'PENDING' } },
    { name: 'tcs.setUnitLoadProgress$', value: [2] },
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 'PENDING' } },

    // start here because loading is lazy
    { name: 'tcs.testStatus$', value: 'RUNNING' },
    { name: 'tls.loadTest', value: undefined },

    // load external unit contents - start with unit 3, because it's the current unit
    { name: 'tcs.totalLoadingProgress', value: 86.66666666666667 }, // 0% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 0 } },
    { name: 'tcs.totalLoadingProgress', value: 90 }, // 50% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 50 } },
    { name: 'tcs.totalLoadingProgress', value: 91.66666666666666 }, // 75% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 75 } },
    { name: 'tcs.totalLoadingProgress', value: 93.33333333333333 }, // 100% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 93.33333333333333 }, // 0% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 0 } },
    { name: 'tcs.totalLoadingProgress', value: 96.66666666666667 }, // 50% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 50 } },
    { name: 'tcs.totalLoadingProgress', value: 98.33333333333333 }, // 75% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 75 } },
    { name: 'tcs.totalLoadingProgress', value: 100 }, // 100% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 100 } }
    // finish
    // { name: 'tcs.totalLoadingProgress', value: 100 }
  ],

  withLoadingModeEager: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },

    // unit 1
    // 5 units, so each triplet of unit-player-content is worth 6.6% in the total progress.
    // total progress gets updated first, don't be confused
    { name: 'tcs.totalLoadingProgress', value: 6.666666666666667 }, // unit 1
    { name: 'tcs.setUnitLoadProgress$', value: [1] },
    { name: 'tcs.unitContentLoadProgress$[1]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // unit 1 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 16.666666666666664 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.333333333333332 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },

    // unit 2
    { name: 'tcs.totalLoadingProgress', value: 26.666666666666668 }, // unit 2
    { name: 'tcs.totalLoadingProgress', value: 26.666666666666668 }, // 0% of another player
    { name: 'tcs.totalLoadingProgress', value: 30 }, // 50% of another player
    { name: 'tcs.totalLoadingProgress', value: 31.666666666666664 }, // 75% of another-player
    { name: 'tcs.totalLoadingProgress', value: 33.33333333333333 }, // 100% of another-player
    { name: 'tcs.totalLoadingProgress', value: 33.33333333333333 }, // 100% of another-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/ANOTHER-PLAYER.HTML'] },

    // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // 0% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 43.333333333333336 }, // 50% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 45 }, // 75% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 46.666666666666664 }, // 100% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 46.666666666666664 }, // 100% of a-player-but-version-2 (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER-2.HTML'] },

    // unit 4
    { name: 'tcs.totalLoadingProgress', value: 53.333333333333336 }, // unit 4
    { name: 'tcs.setUnitLoadProgress$', value: [4] },
    { name: 'tcs.unitContentLoadProgress$[4]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 60 }, // unit 4 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 66.66666666666666 }, // unit 4 player (already loaded)

    // unit 5
    { name: 'tcs.totalLoadingProgress', value: 73.33333333333333 }, // unit 5
    { name: 'tcs.setUnitLoadProgress$', value: [5] },
    { name: 'tcs.unitContentLoadProgress$[5]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 80 }, // unit 5 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 86.66666666666667 }, // unit 5 player (already loaded)

    // external unit contents - start with unit 3, because it's the current unit
    { name: 'tcs.setUnitLoadProgress$', value: [3] },
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 'PENDING' } },
    { name: 'tcs.setUnitLoadProgress$', value: [2] },
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 'PENDING' } },
    { name: 'tcs.totalLoadingProgress', value: 86.66666666666667 }, // 0% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 0 } },
    { name: 'tcs.totalLoadingProgress', value: 90 }, // 50% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 50 } },
    { name: 'tcs.totalLoadingProgress', value: 91.66666666666666 }, // 75% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 75 } },
    { name: 'tcs.totalLoadingProgress', value: 93.33333333333333 }, // 100% of unit 3 content
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 93.33333333333333 }, // 0% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 0 } },
    { name: 'tcs.totalLoadingProgress', value: 96.66666666666667 }, // 50% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 50 } },
    { name: 'tcs.totalLoadingProgress', value: 98.33333333333333 }, // 75% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 75 } },
    { name: 'tcs.totalLoadingProgress', value: 100 }, // 100% of unit 2 content
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 100 } },

    // don't start until now because loadingMode is EAGER
    { name: 'bs.addTestLog', value: ['LOADCOMPLETE'] },
    { name: 'tcs.totalLoadingProgress', value: 100 },
    { name: 'tcs.testStatus$', value: 'RUNNING' },
    { name: 'tls.loadTest', value: undefined }
  ],

  withMissingUnit: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tcs.totalLoadingProgress', value: 6.666666666666667 }, // unit 1
    { name: 'tcs.setUnitLoadProgress$', value: [1] },
    { name: 'tcs.unitContentLoadProgress$[1]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // unit 1 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 16.666666666666664 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.333333333333332 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },
    { name: 'tls.loadTest', value: '', error: 'No resources for unitId: `MISSING`.' }
  ],

  withBrokenBooklet: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tls.loadTest', value: '', error: 'Root element fo Booklet should be <Booklet>' }
  ],

  withMissingPlayer: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tcs.totalLoadingProgress', value: 6.666666666666667 }, // unit 1
    { name: 'tcs.setUnitLoadProgress$', value: [1] },
    { name: 'tcs.unitContentLoadProgress$[1]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // unit 1 content (was embedded)
    { name: 'tls.loadTest', value: '', error: 'player is missing' }
  ],

  withMissingUnitContent: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tcs.totalLoadingProgress', value: 6.666666666666667 }, // unit 1
    { name: 'tcs.setUnitLoadProgress$', value: [1] },
    { name: 'tcs.unitContentLoadProgress$[1]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // unit 1 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 13.333333333333334 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 16.666666666666664 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.333333333333332 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },
    { name: 'tcs.totalLoadingProgress', value: 26.666666666666668 }, // unit 2
    { name: 'tcs.totalLoadingProgress', value: 26.666666666666668 }, // 0% of another player
    { name: 'tcs.totalLoadingProgress', value: 30 }, // 50% of another player
    { name: 'tcs.totalLoadingProgress', value: 31.666666666666664 }, // 75% of another-player
    { name: 'tcs.totalLoadingProgress', value: 33.33333333333333 }, // 100% of another-player
    { name: 'tcs.totalLoadingProgress', value: 33.33333333333333 }, // 100% of another-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/ANOTHER-PLAYER.HTML'] },
    { name: 'tcs.totalLoadingProgress', value: 40 }, // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // 0% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 43.333333333333336 }, // 50% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 45 }, // 75% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 46.666666666666664 }, // 100% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 46.666666666666664 }, // 100% of a-player-but-version-2 (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER-2.HTML'] },
    { name: 'tcs.totalLoadingProgress', value: 53.333333333333336 }, // unit 4
    { name: 'tcs.setUnitLoadProgress$', value: [4] },
    { name: 'tcs.unitContentLoadProgress$[4]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 60 }, // unit 4 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 66.66666666666666 }, // unit 4 player (already loaded)
    { name: 'tcs.totalLoadingProgress', value: 73.33333333333333 }, // unit 5
    { name: 'tcs.setUnitLoadProgress$', value: [5] },
    { name: 'tcs.unitContentLoadProgress$[5]', value: { progress: 100 } },
    { name: 'tcs.totalLoadingProgress', value: 80 }, // unit 5 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 86.66666666666667 }, // unit 5 player (already loaded)
    { name: 'tcs.setUnitLoadProgress$', value: [3] },
    { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 'PENDING' } },
    { name: 'tcs.setUnitLoadProgress$', value: [2] },
    { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 'PENDING' } }
  ]
};
