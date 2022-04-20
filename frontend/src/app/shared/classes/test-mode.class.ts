import { TestModeData } from 'testcenter-common/classes/test-mode-data.class';

export class TestMode extends TestModeData {
  modeId: keyof typeof TestModeData.modes = 'RUN-DEMO';
  modeLabel: string = 'Demo';

  constructor(loginMode: string = 'RUN-DEMO') {
    super();
    const mode = <keyof typeof TestModeData.modes>loginMode.toUpperCase();

    if (!mode || !TestModeData.modes[mode]) {
      console.warn(`TestConfig: invalid loginMode ${mode} - take DEMO`);
      return;
    }

    this.modeId = mode;
    this.modeLabel = TestModeData.labels[mode];

    Object.keys(TestModeData.modes[mode])
      .forEach(key => {
        this[key] = TestModeData.modes[mode][key];
      });
  }
}
