import { EventEmitter } from 'events';
import {
  DeleteMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import * as Sentry from '@sentry/node';
import { config } from './config';
import { SqsConsumer } from './SqsConsumer';
import * as Consumer from './eventConsumer/userEvents/userEventConsumer';
import { serverLogger } from '@pocket-tools/ts-logger';

describe('sqsConsumer', () => {
  let emitter: EventEmitter;
  let sqsConsumer: SqsConsumer;

  //fake Message mimicing SQS Body
  //note: the message contains SNS payload
  //the `message` inside SNS payload is the event bridge content
  const fakeMessageBody = {
    Type: 'Notification',
    MessageId: '5a0652eb-ea7f-5107-a221-0ebd72b2963e',
    TopicArn:
      'arn:aws:sns:us-east-1:410318598490:PocketEventBridge-Dev-ProspectEventTopic',
    Message:
      '{"version":"0","id":"86e086d4-c38e-2c37-0a2d-96c3db4befa8","detail-type":"account-deletion","source":"user-events","account":"410318598490","time":"2023-02-03T01:00:06Z","region":"us-east-1","resources":[],"detail":{"userId": "1"}}',
    Timestamp: '2023-02-03T05:07:25.299Z',
    SignatureVersion: '1',
    Signature:
      'aKnaDzCpDmZF8C33r4NVpT/wVh1zZMrucnv2LpfnMkSHorS+6BByAMl6ufZIH+vLKNi2OE0BUWqmuH0KKQ0VgQAMWOfFrk/f2qYPrU2r9HAXgpZmuRhYGe0NpIQWKYX7GGiDjEbFIQS/d+nd6VMc98+GlbQ1fqqwEt9WDT30aZrTA36gFLzLaKQnNUM6L7/HhD/HYUxTCyD0Zw3916EZCE46JA+4Bevw+uDxc9X7a2NQEjs6ACrV4D72VT9Xg5wyKz4pAx65IVC09UCxQt5FSH+XXcogM5KvMtkKdVnAM2QlC30q/5ygIjbUC4DGvRsiP5kKgUMsr6ZQ003ZIIx3iQ==',
    SigningCertURL:
      'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-56e67fcb41f6fec09b0196692625d385.pem',
    UnsubscribeURL:
      'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:410318598490:PocketEventBridge-Dev-ProspectEventTopic:ee0ddf8a-ace7-4a9b-9b30-391eb601edc7',
  };

  let scheduleStub: jest.SpyInstance;
  let sentryStub: jest.SpyInstance;
  let consoleStub: jest.SpyInstance;
  let userEventConsumerStub: jest.SpyInstance;

  beforeEach(() => {
    emitter = new EventEmitter();
    sqsConsumer = new SqsConsumer(emitter, false);
    scheduleStub = jest
      .spyOn(sqsConsumer, 'scheduleNextPoll')
      .mockImplementation(() => Promise.resolve());

    sentryStub = jest.spyOn(Sentry, 'captureException').mockImplementation();
    consoleStub = jest.spyOn(serverLogger, 'error').mockImplementation();
    userEventConsumerStub = jest
      .spyOn(Consumer, 'userEventConsumer')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    //require this to clear `spyOn` counts between tests
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.clearAllTimers();
    emitter.removeAllListeners();
  });

  it('sends an event when the class is initialized', () => {
    const eventSpy = jest.spyOn(emitter, 'emit').mockClear();
    jest
      .spyOn(SqsConsumer.prototype, 'pollMessage')
      .mockImplementation(() => Promise.resolve());
    new SqsConsumer(emitter);
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith('pollSnowplowSqsQueue');
  });

  it('invokes listener when pollSnowplowSqsQueue event is emitted', async () => {
    const listenerStub = jest
      .spyOn(sqsConsumer, 'pollMessage')
      .mockImplementation(() => Promise.resolve());
    emitter.emit('pollSnowplowSqsQueue');
    expect(listenerStub).toHaveBeenCalledTimes(1);
  });
  it('schedules a poll event after some time if no messages returned', async () => {
    jest
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(() => Promise.resolve({ Messages: [] }));
    await sqsConsumer.pollMessage();
    expect(scheduleStub).toHaveBeenCalledTimes(1);
    expect(scheduleStub).toHaveBeenCalledWith(300000);
  });

  it('logs critical error if could not receive messages, and reschedules', async () => {
    const error = new Error(`You got Q'd`);
    jest
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(() => Promise.reject(error));
    await sqsConsumer.pollMessage();
    expect(sentryStub).toHaveBeenCalledTimes(1);
    expect(sentryStub).toHaveBeenCalledWith(error, {
      level: 'fatal',
    });
    expect(consoleStub).toHaveBeenCalledTimes(1);
    //assert to reschedule after 5 mins
    expect(scheduleStub).toHaveBeenCalledTimes(1);
    expect(scheduleStub).toHaveBeenCalledWith(300000);
  });

  describe('With a message', () => {
    describe('pollMessage', () => {
      it('invokes eventConsumer on successful message polling', async () => {
        const testMessages = {
          Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
        };

        jest
          .spyOn(SQSClient.prototype, 'send')
          .mockImplementation(() => Promise.resolve(testMessages));
        await sqsConsumer.pollMessage();
        expect(userEventConsumerStub).toBeTruthy();
      });
    });
  });

  it('schedules polling another message after a delay', async () => {
    const sqsMessage = {
      Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
    };
    jest
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(() => Promise.resolve(sqsMessage));
    jest
      .spyOn(sqsConsumer, 'processMessage')
      .mockImplementation(() => Promise.resolve(true));
    await sqsConsumer.pollMessage();
    expect(scheduleStub).toHaveBeenCalledTimes(1);
    expect(scheduleStub).toHaveBeenCalledWith(100);
  });

  it('sends a delete if message was successfully processed', async () => {
    jest
      .spyOn(sqsConsumer, 'processMessage')
      .mockImplementation(() => Promise.resolve(true));
    const sqsStub = jest
      .spyOn(SQSClient.prototype, 'send')
      .mockClear()
      .mockImplementationOnce(() =>
        Promise.resolve({
          Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
        }),
      )
      .mockImplementation(() => Promise.resolve());
    await sqsConsumer.pollMessage();
    expect(sqsStub).toHaveBeenCalledTimes(2);
    expect(sqsStub.mock.calls[1][0].input).toEqual(
      new DeleteMessageCommand({
        QueueUrl: config.aws.sqs.sharedSnowplowQueue.url,
        ReceiptHandle: undefined,
      }).input,
    );
  });

  it('delete message and add to DLQ if not successfully processed', async () => {
    const testVal = {
      Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
    };
    jest
      .spyOn(sqsConsumer, 'processMessage')
      .mockImplementation(() => Promise.resolve(false));
    const sqsStub = jest
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementationOnce(() => Promise.resolve(testVal))
      .mockImplementation(() => Promise.resolve());
    await sqsConsumer.pollMessage();
    expect(sqsStub).toHaveBeenCalledTimes(3);
    expect(sqsStub.mock.calls[1][0].input).toEqual(
      new SendMessageCommand({
        QueueUrl: config.aws.sqs.sharedSnowplowQueue.dlqUrl,
        MessageBody: testVal.Messages[0].Body,
      }).input,
    );
    expect(sqsStub.mock.calls[2][0].input).toEqual(
      new DeleteMessageCommand({
        QueueUrl: config.aws.sqs.sharedSnowplowQueue.url,
        ReceiptHandle: undefined,
      }).input,
    );
  });
});
