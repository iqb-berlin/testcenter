import { CodingScheme } from '@iqb/responses';
import { of } from 'rxjs';
import {
  LoadingProgress,
  TestDataResourcesMap, Testlet, TestStateKey, Unit, UnitData
} from '../interfaces/test-controller.interfaces';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../../shared/shared.module';
import { WatcherLogEntry } from './watcher.util';

export const TestBookletXML = `<Booklet>
  <Metadata>
    <Id>BookletId</Id>
    <Label>Label</Label>
  </Metadata>

  <BookletConfig>
    <Config key="force_presentation_complete">ON</Config>
    <Config key="force_response_complete">OFF</Config>
    <Config key="loading_mode">EAGER</Config>
    <Config key="unit_responses_buffer_time">1000</Config>
    <Config key="unit_state_buffer_time">3000</Config>
    <Config key="test_state_buffer_time">700</Config>
  </BookletConfig>

  <Units>
    <Restrictions>
      <DenyNavigationOnIncomplete presentation="OFF" response="ON"/>
      <TimeMax minutes="10" />
    </Restrictions>
    <Unit id="u1" label="Unit-1" labelshort="U1" />
    <Testlet id="t1" label="Label 1">
     <Restrictions>
       <CodeToEnter code="d" />
       <TimeMax minutes="5" />
     </Restrictions>
     <Unit id="u2" label="Unit-2" labelshort="U2" />
     <Testlet id="t2" label="Label 2">
       <Restrictions>
         <CodeToEnter code="d" />
         <TimeMax minutes="3" />
         <DenyNavigationOnIncomplete presentation="ON" response="OFF"/>
       </Restrictions>
       <Unit id="u3" label="Unit-3" labelshort="U3" />
     </Testlet>
     <Unit id="u4" label="Unit-4" labelshort="U4" />
    </Testlet>
    <Unit id="u5" label="Unit-5" labelshort="U5" />
  </Units>
</Booklet>` as const;

export const TestBookletXmlVariants = {
  withLoadingModeEager: TestBookletXML,
  withLoadingModeLazy: TestBookletXML.replace('key="loading_mode">EAGER', 'key="loading_mode">LAZY'),
  withMissingUnit: TestBookletXML.replace('<Unit id="u2"', '<Unit id="MISSING"'),
  withBrokenBooklet: 'Broken < stuff',
  withMissingPlayer: TestBookletXML,
  withMissingUnitContent: TestBookletXML
} as const;

export const TestUnitsFromBackend: { [unitId: string]: UnitData } = {
  u1: {
    dataParts: { all: 'data from a previous session' },
    state: {},
    definition: 'the unit (1) definition itself',
    unitResponseType: 'the-data-type',
    definitionType: 'plaintext'
  },
  u2: {
    dataParts: { all: 'data from a previous session' },
    state: {
      PRESENTATION_PROGRESS: 'some',
      CURRENT_PAGE_ID: '1',
      CURRENT_PAGE_NR: 1
    },
    definition: '',
    unitResponseType: 'the-data-type',
    definitionType: 'ANOTHER-PLAYER'
  },
  u3: {
    dataParts: { all: 'data from a previous session' },
    state: {
      RESPONSE_PROGRESS: 'complete'
    },
    definition: '',
    unitResponseType: 'the-data-type',
    definitionType: 'ANOTHER-PLAYER'
  },
  u4: {
    dataParts: { all: 'data from a previous session' },
    state: {
      CURRENT_PAGE_ID: '2'
    },
    definition: 'the unit (4) definition itself',
    unitResponseType: 'the-data-type',
    definitionType: 'ANOTHER-PLAYER'
  },
  u5: {
    dataParts: { all: 'data from a previous session' },
    state: {},
    definition: 'the unit (5) definition itself',
    unitResponseType: 'the-data-type',
    definitionType: 'ANOTHER-PLAYER'
  }
} as const;

export const TestPlayers = {
  'Resource/A-PLAYER.HTML': 'a player',
  'Resource/ANOTHER-PLAYER.HTML': 'another player',
  'Resource/A-PLAYER-2.HTML': 'a player, but version 2'
} as const;

export const TestExternalUnitContents = {
  'Resource/test-unit-content-u2.voud': 'the unit (2) definition',
  'Resource/test-unit-content-u3.voud': 'the unit (3) definition'
} as const;

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
} as const;

export const TestTestState: { [k in TestStateKey]?: string } = {
  CURRENT_UNIT_ID: 'u3'
} as const;

export const getTestData = () => {
  const Testlets: { [key: string]: Testlet } = {
    root: {
      id: '[0]',
      label: '',
      locks: {
        show: false,
        time: false,
        code: false,
        afterLeave: false
      },
      locked: null,
      timerId: '[0]',
      restrictions: {
        denyNavigationOnIncomplete: {
          presentation: 'OFF',
          response: 'ON'
        },
        timeMax: {
          minutes: 10,
          leave: 'confirm'
        }
      },
      blockLabel: '',
      children: []
    },
    t1: {
      id: 't1',
      label: 'Label 1',
      locks: {
        show: false,
        time: false,
        code: true,
        afterLeave: false
      },
      locked: null,
      timerId: '[0]',
      restrictions: {
        denyNavigationOnIncomplete: {
          presentation: 'OFF',
          response: 'ON'
        },
        codeToEnter: {
          code: 'd',
          message: ''
        },
        timeMax: {
          minutes: 5,
          leave: 'confirm'
        }
      },
      blockLabel: 'Label 1',
      children: []
    },
    t2: {
      id: 't2',
      label: 'Label 2',
      locks: {
        show: false,
        time: false,
        code: true,
        afterLeave: false
      },
      locked: null,
      timerId: '[0]',
      restrictions: {
        denyNavigationOnIncomplete: {
          presentation: 'ON',
          response: 'OFF'
        },
        codeToEnter: {
          code: 'd',
          message: ''
        },
        timeMax: {
          minutes: 3,
          leave: 'confirm'
        }
      },
      blockLabel: 'Label 1',
      children: []
    }
  };

  const Units: { [key: string]: Unit } = {
    u1: {
      id: 'u1',
      alias: 'u1',
      label: 'Unit-1',
      labelShort: 'U1',
      sequenceId: 1,
      parent: Testlets.root,
      localIndex: 0,
      unitDefinitionType: 'plaintext',
      variables: {},
      baseVariableIds: [],
      playerFileName: 'Resource/A-PLAYER.HTML',
      scheme: new CodingScheme([]),
      responseType: 'the-data-type',
      definition: 'the unit (1) definition itself',
      state: {},
      dataParts: { all: 'data from a previous session' },
      loadingProgress: {
        definition: of<LoadingProgress>({ progress: 0 })
      },
      lockedAfterLeaving: false,
      pageLabels: {}
    },
    u2: {
      id: 'u2',
      alias: 'u2',
      label: 'Unit-2',
      labelShort: 'U2',
      sequenceId: 2,
      parent: Testlets.t1,
      localIndex: 0,
      unitDefinitionType: 'ANOTHER-PLAYER',
      variables: {},
      baseVariableIds: [],
      playerFileName: 'Resource/ANOTHER-PLAYER.HTML',
      scheme: new CodingScheme([]),
      responseType: 'the-data-type',
      definition: 'the unit (2) definition',
      state: {
        PRESENTATION_PROGRESS: 'some',
        CURRENT_PAGE_ID: '1',
        CURRENT_PAGE_NR: 1
      },
      dataParts: { all: 'data from a previous session' },
      loadingProgress: {
        definition: of({ progress: 100 })
      },
      lockedAfterLeaving: false,
      pageLabels: {}
    },
    u3: {
      id: 'u3',
      alias: 'u3',
      label: 'Unit-3',
      labelShort: 'U3',
      sequenceId: 3,
      parent: Testlets.t2,
      localIndex: 0,
      unitDefinitionType: 'ANOTHER-PLAYER',
      variables: {},
      baseVariableIds: [],
      playerFileName: 'Resource/A-PLAYER-2.HTML',
      scheme: new CodingScheme([]),
      responseType: 'the-data-type',
      definition: 'the unit (3) definition',
      state: {
        RESPONSE_PROGRESS: 'complete'
      },
      dataParts: { all: 'data from a previous session' },
      loadingProgress: {
        definition: of<LoadingProgress>({ progress: 0 })
      },
      lockedAfterLeaving: false,
      pageLabels: {}
    },
    u4: {
      id: 'u4',
      alias: 'u4',
      label: 'Unit-4',
      labelShort: 'U4',
      sequenceId: 4,
      parent: Testlets.t1,
      localIndex: 1,
      unitDefinitionType: 'ANOTHER-PLAYER',
      variables: {},
      baseVariableIds: [],
      playerFileName: 'Resource/A-PLAYER.HTML',
      scheme: new CodingScheme([]),
      responseType: 'the-data-type',
      definition: 'the unit (4) definition itself',
      state: {
        CURRENT_PAGE_ID: '2'
      },
      dataParts: { all: 'data from a previous session' },
      loadingProgress: {
        definition: of<LoadingProgress>({ progress: 0 })
      },
      lockedAfterLeaving: false,
      pageLabels: {}
    },
    u5: {
      id: 'u5',
      alias: 'u5',
      label: 'Unit-5',
      labelShort: 'U5',
      sequenceId: 5,
      parent: Testlets.root,
      localIndex: 1,
      unitDefinitionType: 'ANOTHER-PLAYER',
      variables: {},
      baseVariableIds: [],
      playerFileName: 'Resource/A-PLAYER.HTML',
      scheme: new CodingScheme([]),
      responseType: 'the-data-type',
      definition: 'the unit (5) definition itself',
      state: {},
      dataParts: { all: 'data from a previous session' },
      loadingProgress: {
        definition: of<LoadingProgress>({ progress: 0 })
      },
      lockedAfterLeaving: false,
      pageLabels: {}
    }
  };

  Testlets.root.children.push(Units.u1, Testlets.t1, Units.u5);
  Testlets.t1.children.push(Units.u2, Testlets.t2, Units.u4);
  Testlets.t2.children.push(Units.u3);
  Testlets.t1.locked = { by: 'code', through: Testlets.t1 };
  Testlets.t2.locked = { by: 'code', through: Testlets.t1 };

  return { Units, Testlets };
};

export const getTestBookletConfig = () => {
  const TestBookletConfig = new BookletConfig();
  TestBookletConfig.force_presentation_complete = 'ON';
  TestBookletConfig.force_response_complete = 'OFF';
  TestBookletConfig.loading_mode = 'EAGER';
  TestBookletConfig.unit_responses_buffer_time = '1000';
  TestBookletConfig.unit_state_buffer_time = '3000';
  TestBookletConfig.test_state_buffer_time = '700';
  return TestBookletConfig;
}

export const TestLoadingProtocols: { [testId in keyof typeof TestBookletXmlVariants]: WatcherLogEntry[] } = {
  withLoadingModeLazy: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },

    // unit 1
    // 5 units, so each part of a quartet of unit-player-content-scheme is worth 5% in the total progress.
    // total progress gets updated first , don't be confused
    { name: 'tcs.totalLoadingProgress', value: 5 }, // scheme 1 (did not exist)
    { name: 'tcs.totalLoadingProgress', value: 10 }, // unit 1
    { name: 'tcs.totalLoadingProgress', value: 15 }, // unit 1 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 15 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 17.5 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.75 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },

    // unit 2
    { name: 'tcs.totalLoadingProgress', value: 25 }, // scheme 2 (did not exist)
    { name: 'tcs.totalLoadingProgress', value: 30 }, // unit 2
    { name: 'tcs.totalLoadingProgress', value: 30 }, // 0% of another player
    { name: 'tcs.totalLoadingProgress', value: 32.5 }, // 50% of another player
    { name: 'tcs.totalLoadingProgress', value: 33.75 }, // 75% of another-player
    { name: 'tcs.totalLoadingProgress', value: 35 }, // 100% of another-player
    { name: 'tcs.totalLoadingProgress', value: 35 }, // 100% of another-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/ANOTHER-PLAYER.HTML'] },

    // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // scheme 3 (did not exist)
    { name: 'tcs.totalLoadingProgress', value: 45 }, // unit 3
    { name: 'tcs.totalLoadingProgress', value: 45 }, // 0% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 47.5 }, // 50% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 48.75 }, // 75% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 50 }, // 100% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 50 }, // 100% of a-player-but-version-2 (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER-2.HTML'] },

    // unit 4
    { name: 'tcs.totalLoadingProgress', value: 55.00000000000001 }, // scheme 4 (did not exist)
    { name: 'tcs.totalLoadingProgress', value: 60 }, // unit 4
    { name: 'tcs.totalLoadingProgress', value: 65 }, // unit 4 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 70 }, // unit 4 player (already loaded)

    // unit 5
    { name: 'tcs.totalLoadingProgress', value: 75 }, // scheme 5
    { name: 'tcs.totalLoadingProgress', value: 80 }, // unit 5
    { name: 'tcs.totalLoadingProgress', value: 85 }, // unit 5 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 90 }, // unit 5 player (already loaded)

    // start here because loading is lazy
    { name: 'tcs.testStatus$', value: 'RUNNING' },
    { name: 'tls.loadTest', value: true },

    // load external unit contents - start with unit 3, because it's the current unit
    { name: 'tcs.totalLoadingProgress', value: 90 }, // 0% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 92.5 }, // 50% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 93.75 }, // 75% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 95 }, // 100% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 95 }, // 0% of unit 2 definition
    { name: 'tcs.totalLoadingProgress', value: 97.5 }, // 50% of unit 2 definition
    { name: 'tcs.totalLoadingProgress', value: 98.75 }, // 75% of unit 2 definition
    { name: 'tcs.totalLoadingProgress', value: 100 } // 100% of unit 2 definition
    // finish
  ],

  withLoadingModeEager: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },

    // unit 1
    // 5 units, so each triplet of unit-player-content is worth 6.6% in the total progress.
    // total progress gets updated first, don't be confused
    { name: 'tcs.totalLoadingProgress', value: 5 }, // scheme 1
    { name: 'tcs.totalLoadingProgress', value: 10 }, // unit 1
    { name: 'tcs.totalLoadingProgress', value: 15 }, // unit 1 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 15 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 17.5 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.75 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },

    // unit 2
    { name: 'tcs.totalLoadingProgress', value: 25 }, // scheme 2
    { name: 'tcs.totalLoadingProgress', value: 30 }, // unit 2
    { name: 'tcs.totalLoadingProgress', value: 30 }, // 0% of another player
    { name: 'tcs.totalLoadingProgress', value: 32.5 }, // 50% of another player
    { name: 'tcs.totalLoadingProgress', value: 33.75 }, // 75% of another-player
    { name: 'tcs.totalLoadingProgress', value: 35 }, // 100% of another-player
    { name: 'tcs.totalLoadingProgress', value: 35 }, // 100% of another-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/ANOTHER-PLAYER.HTML'] },

    // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // scheme 3
    { name: 'tcs.totalLoadingProgress', value: 45 }, // unit 3
    { name: 'tcs.totalLoadingProgress', value: 45 }, // 0% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 47.5 }, // 50% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 48.75 }, // 75% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 50 }, // 100% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 50 }, // 100% of a-player-but-version-2 (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER-2.HTML'] },

    // unit 4
    { name: 'tcs.totalLoadingProgress', value: 55.00000000000001 }, // scheme 4
    { name: 'tcs.totalLoadingProgress', value: 60 }, // unit 4
    { name: 'tcs.totalLoadingProgress', value: 65 }, // unit 4 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 70 }, // unit 4 player (already loaded)

    // unit 5
    { name: 'tcs.totalLoadingProgress', value: 75 }, // scheme 5
    { name: 'tcs.totalLoadingProgress', value: 80 }, // unit 5
    { name: 'tcs.totalLoadingProgress', value: 85 }, // unit 5 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 90 }, // unit 5 player (already loaded)

    // external unit contents - start with unit 3, because it's the current unit
    { name: 'tcs.totalLoadingProgress', value: 90 }, // 0% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 92.5 }, // 50% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 93.75 }, // 75% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 95 }, // 100% of unit 3 definition
    { name: 'tcs.totalLoadingProgress', value: 95 }, // 0% of unit 2 definition
    { name: 'tcs.totalLoadingProgress', value: 97.5 }, // 50% of unit 2 definition
    { name: 'tcs.totalLoadingProgress', value: 98.75 }, // 75% of unit 2 definition
    { name: 'tcs.totalLoadingProgress', value: 100 }, // 100% of unit 2 definition

    // don't start until now because loadingMode is EAGER
    { name: 'bs.addTestLog', value: ['LOADCOMPLETE'] },
    { name: 'tcs.totalLoadingProgress', value: 100 },
    { name: 'tcs.testStatus$', value: 'RUNNING' },
    { name: 'tls.loadTest', value: true }
  ],

  withMissingUnit: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tcs.totalLoadingProgress', value: 5 }, // scheme 1
    { name: 'tcs.totalLoadingProgress', value: 10 }, // unit 1
    { name: 'tcs.totalLoadingProgress', value: 15 }, // unit 1 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 15 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 17.5 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.75 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },
    { name: 'tls.loadTest', value: '', error: 'No resources for unitId: `MISSING`.' }
  ],

  withBrokenBooklet: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tls.loadTest', value: '', error: 'wrong root-tag' }
  ],

  withMissingPlayer: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tcs.totalLoadingProgress', value: 5 }, // scheme 1
    { name: 'tcs.totalLoadingProgress', value: 10 }, // unit 1
    { name: 'tcs.totalLoadingProgress', value: 15 }, // unit 1 definition (was embedded)
    { name: 'tls.loadTest', value: '', error: 'player is missing' }
  ],

  withMissingUnitContent: [
    { name: 'tcs.testStatus$', value: 'INIT' },
    { name: 'tcs.totalLoadingProgress', value: 0 },
    { name: 'tcs.testStatus$', value: 'LOADING' },
    { name: 'tcs.totalLoadingProgress', value: 5 }, // scheme 1
    { name: 'tcs.totalLoadingProgress', value: 10 }, // unit 1
    { name: 'tcs.totalLoadingProgress', value: 15 }, // unit 1 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 15 }, // 0% of a-player
    { name: 'tcs.totalLoadingProgress', value: 17.5 }, // 50% of a-player
    { name: 'tcs.totalLoadingProgress', value: 18.75 }, // 75% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player
    { name: 'tcs.totalLoadingProgress', value: 20 }, // 100% of a-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER.HTML'] },

    // unit 2
    { name: 'tcs.totalLoadingProgress', value: 25 }, // scheme 2
    { name: 'tcs.totalLoadingProgress', value: 30 }, // unit 2
    { name: 'tcs.totalLoadingProgress', value: 30 }, // 0% of another player
    { name: 'tcs.totalLoadingProgress', value: 32.5 }, // 50% of another player
    { name: 'tcs.totalLoadingProgress', value: 33.75 }, // 75% of another-player
    { name: 'tcs.totalLoadingProgress', value: 35 }, // 100% of another-player
    { name: 'tcs.totalLoadingProgress', value: 35 }, // 100% of another-player (again)
    { name: 'tcs.addPlayer', value: ['Resource/ANOTHER-PLAYER.HTML'] },

    // unit 3
    { name: 'tcs.totalLoadingProgress', value: 40 }, // scheme 3
    { name: 'tcs.totalLoadingProgress', value: 45 }, // unit 3
    { name: 'tcs.totalLoadingProgress', value: 45 }, // 0% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 47.5 }, // 50% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 48.75 }, // 75% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 50 }, // 100% of a-player-but-version-2
    { name: 'tcs.totalLoadingProgress', value: 50 }, // 100% of a-player-but-version-2 (again)
    { name: 'tcs.addPlayer', value: ['Resource/A-PLAYER-2.HTML'] },

    // unit 4
    { name: 'tcs.totalLoadingProgress', value: 55.00000000000001 }, // scheme 4
    { name: 'tcs.totalLoadingProgress', value: 60 }, // unit 4
    { name: 'tcs.totalLoadingProgress', value: 65 }, // unit 4 definition (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 70 }, // unit 4 player (already loaded)

    // unit 5
    { name: 'tcs.totalLoadingProgress', value: 75 }, // scheme 5
    { name: 'tcs.totalLoadingProgress', value: 80 }, // unit 5
    { name: 'tcs.totalLoadingProgress', value: 85 }, // unit 5 content (was embedded)
    { name: 'tcs.totalLoadingProgress', value: 90 } // unit 5 player (already loaded)
  ]
};

