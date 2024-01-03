import {
  SendMessageCommand,
  SendMessageCommandOutput,
  SQSClient,
} from '@aws-sdk/client-sqs';
import config from './config';

export const sqsClient = new SQSClient({
  endpoint: config.aws.endpoint,
  region: config.aws.region,
  maxAttempts: 3,
});

/**
 * Send SQS message to queue
 * @param data
 */
export async function sendMessage(
  data: object
): Promise<SendMessageCommandOutput> {
  const command = new SendMessageCommand({
    MessageBody: JSON.stringify(data),
    QueueUrl: config.aws.sqs.fxaEventsQueue.url,
  });

  return await sqsClient.send(command);
}
