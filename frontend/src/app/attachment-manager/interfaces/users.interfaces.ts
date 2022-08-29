export interface GroupData {
  name: string;
  label: string;
}

export interface AttachmentTargetLabel {
  personLabel: string;
  testLabel: string;
}

export interface AttachmentData extends AttachmentTargetLabel {
  personLabel: string;
  testLabel: string;
  unitLabel: string;
  type: 'image';
  lastModified: number;
  attachmentId: string;
}
