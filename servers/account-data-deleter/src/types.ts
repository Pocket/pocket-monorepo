export type QueueConfig = {
  batchSize: number;
  url: string;
  visibilityTimeout: number;
  maxMessages: number;
  waitTimeSeconds: number;
  defaultPollIntervalSeconds: number;
  afterMessagePollIntervalSeconds: number;
  messageRetentionSeconds: number;
};

/**
 * Payload of an export request message sent to SQS
 */
export type ExportMessage = {
  userId: number;
  encodedId: string;
  requestId: string;
  cursor: number;
  part: number;
};
