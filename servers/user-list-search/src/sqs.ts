import AWSXRay from 'aws-xray-sdk-core';
import { SQS } from 'aws-sdk';
import {
  ReceiveMessageRequest,
  ReceiveMessageResult,
  SendMessageRequest,
  SendMessageResult,
} from 'aws-sdk/clients/sqs';
import { config } from './config';

const sqs = AWSXRay.captureAWSClient(
  new SQS({
    endpoint: config.aws.sqs.endpoint,
  })
);

/**
 * Sends messages to the SQS queue
 * @param queueUrl
 * @param message
 * @param params
 */
export const sendMessage = (
  queueUrl: string,
  message: Record<string, unknown>,
  params?: SendMessageRequest
): Promise<SendMessageResult> => {
  return sqs
    .sendMessage(
      Object.assign(
        {
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message),
        },
        params
      )
    )
    .promise();
};

/**
 * Receives messages from the SQS queue
 * @param queueUrl
 * @param params
 */
export const receiveMessage = (
  queueUrl: string,
  params?: ReceiveMessageRequest
): Promise<ReceiveMessageResult> => {
  return sqs
    .receiveMessage(
      Object.assign(
        {
          QueueUrl: queueUrl,
          WaitTimeSeconds: config.aws.sqs.waitTimeSeconds,
          MaxNumberOfMessages: 10,
        },
        params
      )
    )
    .promise();
};

/**
 * Purges message from the SQS queue
 * @param queueUrl
 */
export const purgeQueue = (
  queueUrl: string
): Promise<Record<string, unknown>> => {
  return sqs.purgeQueue({ QueueUrl: queueUrl }).promise();
};

/**
 * Deletes messages from the SQS queue
 * @param queueUrl
 * @param receiptHandle
 */
export const deleteMessage = (
  queueUrl: string,
  receiptHandle: string
): Promise<Record<string, unknown>> => {
  return sqs
    .deleteMessage({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
    .promise();
};
