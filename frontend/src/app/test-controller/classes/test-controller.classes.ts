/* eslint-disable max-classes-per-file */

import UAParser from 'ua-parser-js';
import { MaxTimerEvent } from '../interfaces/test-controller.interfaces';

export class EnvironmentData {
  browserVersion = '';
  browserName = '';
  get browserTxt(): string {
    return `${this.browserName} Version ${this.browserVersion}`;
  }

  osName = '';
  device = '';

  screenSizeWidth = 0;
  screenSizeHeight = 0;
  loadTime: number = 0;
  get screenSizeTxt(): string {
    return `Bildschirmgröße ist ${this.screenSizeWidth} x ${this.screenSizeWidth}`;
  }

  constructor() {
    const UserAgentParser = new UAParser();

    this.browserVersion = UserAgentParser.getBrowser().version ?? '--';
    this.browserName = UserAgentParser.getBrowser().name ?? '--';
    this.osName = `${UserAgentParser.getOS().name} ${UserAgentParser.getOS().version}`;
    this.device = Object.values(UserAgentParser.getDevice())
      .filter(elem => elem)
      .join(' ');

    this.screenSizeHeight = window.screen.height;
    this.screenSizeWidth = window.screen.width;
  }
}

export class TimerData {
  timeLeftSeconds: number; // seconds
  id: string;
  type: MaxTimerEvent;

  get timeLeftString(): string {
    const afterDecimal = Math.round(this.timeLeftSeconds % 60);
    const a = (Math.round(this.timeLeftSeconds - afterDecimal) / 60).toString();
    const b = afterDecimal < 10 ? '0' : '';
    const c = afterDecimal.toString();
    return `${a}:${b}${c}`;
  }

  get timeLeftMinString(): string {
    return `${Math.round(this.timeLeftSeconds / 60).toString()} min`;
  }

  constructor(timeMinutes: number, tId: string, type: MaxTimerEvent) {
    this.timeLeftSeconds = timeMinutes * 60;
    this.id = tId;
    this.type = type;
  }
}
