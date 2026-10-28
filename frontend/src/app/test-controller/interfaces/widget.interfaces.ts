export interface WidgetParameter {
  key: string;
  value: string;
}

/** Natural content dimensions in CSS pixels, excluding the host window header. Both must be positive and finite. */
export interface WidgetContentSize {
  width: number;
  height: number;
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
