export interface GroupData {
  name: string;
  label: string;
}

export type AttachmentType = 'capture-image';

export type AttachmentDataType = 'image' | 'missing';

export interface AttachmentData {
  attachmentId: string;
  personLabel: string;
  testLabel: string;
  unitLabel: string;
  dataType: AttachmentDataType;
  lastModified: number;
  attachmentFileIds: string[];
  attachmentType: AttachmentType;
}
