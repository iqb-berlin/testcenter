export interface GroupData {
  name: string;
  label: string;
}

export interface AttachmentTargetLabel {
  personLabel: string;
  testLabel: string;
}

export type AttachmentType = 'capture-image';

export interface AttachmentData extends AttachmentTargetLabel {
  personLabel: string;
  testLabel: string;
  unitLabel: string;
  dataType: 'image';
  lastModified: number;
  attachmentId: string;
  attachmentType: AttachmentType;
  attachmentTargetCode: string;
}
