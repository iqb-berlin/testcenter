export type AttachmentType = 'capture-image';

export type AttachmentDataType = 'image' | 'missing';

export interface AttachmentData {
  attachmentId: string;
  personLabel: string;
  bookletLabel: string;
  unitLabel: string;
  dataType: AttachmentDataType;
  lastModified: number;
  attachmentFileIds: string[];
  attachmentType: AttachmentType;
  variableId: string;
}
