import {
  SendMessageCommand,
  SendMessageCommandOutput,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { config } from './config';
import { UserSearchIndexSqsMessage } from '@pocket-tools/types';

const sqsClient = new SQSClient({
  endpoint: config.aws.sqs.endpoint,
  region: config.aws.region,
  maxAttempts: 3,
});

/**
 * Send SQS message to queue
 * @param data
 */
export async function sendMessage(
  data: UserSearchIndexSqsMessage,
  queueUrl: string,
): Promise<SendMessageCommandOutput> {
  const command = new SendMessageCommand({
    MessageBody: JSON.stringify(data),
    QueueUrl: queueUrl,
  });

  return await sqsClient.send(command);
}
