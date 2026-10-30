export interface WidgetParameter {
  key: string;
  value: string;
}

export interface WidgetCall {
  type: 'vopWidgetCall';
  sessionId: string;
  widgetType: string;
  parameters: WidgetParameter[];
  callId?: string;
  state?: string;
}

export interface WidgetStartCommand {
  type: 'vowStartCommand';
  sessionId: string;
  parameters: WidgetParameter[];
  sharedParameters: WidgetParameter[];
  state?: string;
}
