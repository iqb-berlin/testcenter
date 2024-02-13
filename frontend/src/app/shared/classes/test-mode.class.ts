import { TestModeData } from 'testcenter-common/classes/test-mode-data.class';
import { AppError } from '../../app.interfaces';

export class TestMode extends TestModeData {
  readonly modeId: keyof typeof TestModeData.modes = 'RUN-DEMO';
  readonly modeLabel: string = 'Demo';

  constructor(loginMode: string = 'RUN-DEMO') {
    super();
    const mode: keyof typeof TestModeData.modes = <keyof typeof TestModeData.modes>loginMode.toUpperCase();

    if (!mode || !TestModeData.modes[mode]) {
      throw new AppError({
        type: 'warning',
        label: 'Unbekannte Nutzerrolle',
        description: `Unbekannte Nutzerrolle: ${mode}.`
      });
    }

    (Object.keys(this) as Array<keyof typeof TestModeData.modes[typeof mode]>)
      .forEach((key: keyof typeof TestModeData.modes[typeof mode]) => {
        if (key in this) {
          this[key] = TestModeData.modes[mode][key];
        }
      });

    this.modeId = mode;
    this.modeLabel = TestModeData.labels[mode];
  }
}
