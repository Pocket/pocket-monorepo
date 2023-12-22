import sinon from 'sinon';
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

describe('sqsConsumer', () => {
  const emitter = new EventEmitter();
  const sqsConsumer = new SqsConsumer(emitter, false);

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

  let scheduleStub: sinon.SinonStub;
  let sentryStub: sinon.SinonStub;
  let consoleStub: sinon.SinonStub;
  let userEventConsumerStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.restore();
    scheduleStub = sinon.stub(sqsConsumer, 'scheduleNextPoll').resolves();

    sentryStub = sinon.stub(Sentry, 'captureException');
    consoleStub = sinon.stub(console, 'error');
    userEventConsumerStub = sinon
      .stub(Consumer, 'userEventConsumer')
      .resolves();
  });

  afterEach(() => {
    //require this to clear `spyOn` counts between tests
    jest.clearAllMocks();
    sinon.restore();
  });

  it('sends an event when the class is initialized', () => {
    const eventSpy = sinon.spy(emitter, 'emit');
    sinon.stub(SqsConsumer.prototype, 'pollMessage').resolves();
    new SqsConsumer(emitter);
    expect(eventSpy.calledOnceWithExactly('pollSnowplowSqsQueue')).toBe(true);
  });

  it('invokes listener when pollSnowplowSqsQueue event is emitted', async () => {
    const listenerStub = sinon.stub(sqsConsumer, 'pollMessage').resolves();
    emitter.emit('pollSnowplowSqsQueue');
    expect(listenerStub.callCount).toEqual(1);
  });
  it('schedules a poll event after some time if no messages returned', async () => {
    sinon.stub(SQSClient.prototype, 'send').resolves({ Messages: [] });
    await sqsConsumer.pollMessage();
    expect(scheduleStub.calledOnceWithExactly(300000)).toBe(true);
  });

  it('logs critical error if could not receive messages, and reschedules', async () => {
    const error = new Error(`You got Q'd`);
    sinon.stub(SQSClient.prototype, 'send').rejects(error);
    await sqsConsumer.pollMessage();
    expect(
      sentryStub.calledOnceWithExactly(error, {
        level: Sentry.Severity.Critical,
      })
    ).toBe(true);
    expect(consoleStub.callCount).toEqual(1);
    //assert to reschedule after 5 mins
    expect(scheduleStub.calledOnceWithExactly(300000)).toBe(true);
  });

  describe('With a message', () => {
    describe('pollMessage', () => {
      it('invokes eventConsumer on successful message polling', async () => {
        const testMessages = {
          Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
        };

        sinon.stub(SQSClient.prototype, 'send').resolves(testMessages);
        await sqsConsumer.pollMessage();
        expect(userEventConsumerStub).toBeTruthy();
      });
    });
  });

  it('schedules polling another message after a delay', async () => {
    const sqsMessage = {
      Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
    };
    sinon.stub(SQSClient.prototype, 'send').resolves(sqsMessage);
    sinon.stub(sqsConsumer, 'processMessage').resolves(true);
    await sqsConsumer.pollMessage();
    expect(scheduleStub.calledOnceWithExactly(100)).toBe(true);
  });

  it('sends a delete if message was successfully processed', async () => {
    sinon.stub(sqsConsumer, 'processMessage').resolves(true);
    const sqsStub = sinon
      .stub(SQSClient.prototype, 'send')
      .onFirstCall()
      .resolves({
        Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
      })
      .onSecondCall()
      .resolves();
    await sqsConsumer.pollMessage();
    expect(sqsStub.callCount).toEqual(2);
    expect(sqsStub.secondCall.args[0].input).toEqual(
      new DeleteMessageCommand({
        QueueUrl: config.aws.sqs.sharedSnowplowQueue.url,
        ReceiptHandle: undefined,
      }).input
    );
  });

  it('delete message and add to DLQ if not successfully processed', async () => {
    const testVal = {
      Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
    };
    sinon.stub(sqsConsumer, 'processMessage').resolves(false);
    const sqsStub = sinon
      .stub(SQSClient.prototype, 'send')
      .onFirstCall()
      .resolves(testVal)
      .onSecondCall()
      .resolves()
      .onThirdCall()
      .resolves();
    await sqsConsumer.pollMessage();
    expect(sqsStub.callCount).toEqual(3);
    expect(sqsStub.secondCall.args[0].input).toEqual(
      new SendMessageCommand({
        QueueUrl: config.aws.sqs.sharedSnowplowQueue.dlqUrl,
        MessageBody: testVal.Messages[0].Body,
      }).input
    );
    expect(sqsStub.thirdCall.args[0].input).toEqual(
      new DeleteMessageCommand({
        QueueUrl: config.aws.sqs.sharedSnowplowQueue.url,
        ReceiptHandle: undefined,
      }).input
    );
  });
});
