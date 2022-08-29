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
  dataType: 'image';
  lastModified: number;
  attachmentId: string;
  attachmentType: 'capture-image',
  attachmentTargetCode: string;
}
