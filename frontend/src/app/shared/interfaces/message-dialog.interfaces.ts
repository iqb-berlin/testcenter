export interface MessageDialogData {
  type: 'error' | 'warning' | 'info';
  title: string;
  content: string;
  closebuttonlabel: string;
}
