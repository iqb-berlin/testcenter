import { SharedParameter } from './verona.interfaces';

// Messages between the Testcenter and a widget, see https://github.com/iqb-specifications/plugin-widget

export interface WidgetParameter {
  key: string;
  value: string;
}

export interface VowStartCommand {
  type: 'vowStartCommand';
  sessionId: string;
  parameters: WidgetParameter[];
  sharedParameters: SharedParameter[];
  state?: string;
}

interface WidgetUpdate {
  sessionId: string;
  timeStamp: number;
  state?: string;
  sharedParameters?: SharedParameter[];
}

export interface VowStateChangedNotification extends WidgetUpdate {
  type: 'vowStateChangedNotification';
}

export interface VowReturnRequested extends WidgetUpdate {
  type: 'vowReturnRequested';
  saveState: boolean;
}

export type WidgetMessage = VowStateChangedNotification | VowReturnRequested;

// Messages between a player and the Testcenter about widgets, see https://github.com/verona-interfaces/player

export interface VopWidgetCall {
  type: 'vopWidgetCall';
  sessionId: string;
  // identifies the call in the player; sent back with the return
  callId?: string;
  // the widget's model, e.g. PERIODIC_TABLE
  widgetType: string;
  parameters: WidgetParameter[];
  state?: string;
}

export interface VopWidgetReturn {
  type: 'vopWidgetReturn';
  sessionId: string;
  callId?: string;
  state?: string;
}
