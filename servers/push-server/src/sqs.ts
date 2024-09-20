import {
  DeleteMessageCommand,
  DeleteMessageCommandOutput,
  Message,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';

const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

export const config = {
  jobQueueUrl:
    process.env.JOB_QUEUE_URL ||
    'http://localhost:4566/000000000000/pocket-push-queue',
  tokenQueueUrl:
    process.env.TOKEN_QUEUE_URL ||
    'http://localhost:4566/000000000000/pocket-push-feedback-queue',
  region: process.env.AWS_REGION || 'us-east-1',
  sqsEndpoint: localAwsEndpoint,
};

// Create an SQS service object
const client = new SQSClient({
  endpoint: config.sqsEndpoint,
  region: config.region,
});

export const sqs = {
  getMessages: async (): Promise<Message[]> => {
    const { Messages } = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: config.jobQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }),
    );

    return Messages || [];
  },
  deleteMessage: (message: Message): Promise<DeleteMessageCommandOutput> => {
    return client.send(
      new DeleteMessageCommand({
        QueueUrl: config.jobQueueUrl,
        ReceiptHandle: message.ReceiptHandle || '',
      }),
    );
  },
  destroyToken: (
    tokenType: number,
    token: string,
  ): Promise<SendMessageCommandOutput> => {
    console.log('Invalidating device token', token);

    return client.send(
      new SendMessageCommand({
        QueueUrl: config.tokenQueueUrl,
        MessageBody: JSON.stringify({
          action: 'invalidate',
          notificationType: tokenType,
          token: token,
        }),
      }),
    );
  },
};
