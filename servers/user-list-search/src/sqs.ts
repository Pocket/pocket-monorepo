import {
  DeleteMessageCommand,
  DeleteMessageCommandOutput,
  PurgeQueueCommand,
  PurgeQueueCommandOutput,
  ReceiveMessageCommand,
  ReceiveMessageRequest,
  ReceiveMessageResult,
  SQSClient,
  SendMessageCommand,
  SendMessageRequest,
  SendMessageResult,
} from '@aws-sdk/client-sqs';
import { config } from './config';

const sqs = new SQSClient({
  region: config.aws.region,
  endpoint: config.aws.sqs.endpoint,
});

/**
 * Sends messages to the SQS queue
 * @param queueUrl
 * @param message
 * @param params
 */
export const sendMessage = (
  queueUrl: string,
  message: Record<string, unknown>,
  params?: SendMessageRequest,
): Promise<SendMessageResult> => {
  return sqs.send(new SendMessageCommand(Object.assign(
    {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    },
    params,
  ),))
};

/**
 * Receives messages from the SQS queue
 * @param queueUrl
 * @param params
 */
export const receiveMessage = (
  queueUrl: string,
  params?: ReceiveMessageRequest,
): Promise<ReceiveMessageResult> => {
  return sqs.send(new ReceiveMessageCommand(Object.assign(
    {
      QueueUrl: queueUrl,
      WaitTimeSeconds: config.aws.sqs.waitTimeSeconds,
      MaxNumberOfMessages: 10,
    },
    params,
  )))
};

/**
 * Purges message from the SQS queue
 * @param queueUrl
 */
export const purgeQueue = (
  queueUrl: string,
): Promise<PurgeQueueCommandOutput> => {
  return sqs.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
};

/**
 * Deletes messages from the SQS queue
 * @param queueUrl
 * @param receiptHandle
 */
export const deleteMessage = (
  queueUrl: string,
  receiptHandle: string,
): Promise<DeleteMessageCommandOutput> => {
  return sqs.send(new DeleteMessageCommand({ 
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle, 
  }));

};
