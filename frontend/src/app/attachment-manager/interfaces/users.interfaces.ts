export interface GroupData {
  name: string;
  label: string;
}

export interface AttachmentTargetLabel {
  personLabel: string;
  testLabel: string;
}

export type AttachmentType = 'capture-image';

export type AttachmentDataType = 'image' | 'missing';

export interface AttachmentData extends AttachmentTargetLabel {
  personLabel: string;
  testLabel: string;
  unitLabel: string;
  dataType: AttachmentDataType;
  lastModified: number;
  attachmentId: string;
  attachmentType: AttachmentType;
}
