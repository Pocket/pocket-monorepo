import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from './sqs';
import { worker } from './worker';

describe('e2e test', () => {
  it('Receives message from queue and sends it', async () => {
    // Create an SQS service object
    const sqs = new SQSClient({
      endpoint: config.sqsEndpoint,
    });

    await sqs.send(
      new SendMessageCommand({
        MessageBody:
          '{"target":"7","recipient":"prod::5Ql5u42mfZPn6dUyWVGZlDsmEnl\\/QXunIscfuplGd23=","message":"Ping","guid":"ej3ptTf6A1emRLyP6cg671cyDPd7A06d538Af0L526ND7Gp1d1f8bf9aG64DoADT"}' /* required */,
        QueueUrl: config.jobQueueUrl /* required */,
      }),
    );
    return await worker.work(1);
  });
});
