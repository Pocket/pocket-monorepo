/**
 * Payload of an export request message sent to SQS
 */
export type ExportMessage = {
  userId: string;
  encodedId: string;
  requestId: string;
  cursor: number;
  part: number;
};

/**
 * Payload of an export request message sent to SQS
 */
export type RequestStatusUpdate = {
  userId: string;
  encodedId: string;
  requestId: string;
  service: 'annotations' | 'list' | 'shareable-lists';
};
