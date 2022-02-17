export enum MessageType {
  error,
  warning,
  info
}

export interface MessageDialogData {
  type: MessageType;
  title: string;
  content: string;
  closebuttonlabel: string;
}
