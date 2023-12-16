import sinon from 'sinon';
import { EventEmitter } from 'events';
import { BatchDeleteHandler, BatchDeleteMessage } from './batchDeleteHandler';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { HighlightsDataService } from '../../dataservices/highlights';
import * as Sentry from '@sentry/node';
import { SeverityLevel } from '@sentry/types';
import config from '../../config';
import { serverLogger } from '../';

describe('batchDeleteHandler', () => {
  const emitter = new EventEmitter();
  const batchDeleteHandler = new BatchDeleteHandler(emitter, false);
  const fakeMessageBody: BatchDeleteMessage = {
    traceId: 'abc-123',
    annotationIds: ['1', '2', '3', '4', '5'],
    userId: 123,
  };
  let scheduleStub: sinon.SinonStub;
  let sentryStub: sinon.SinonStub;
  let serverLoggerStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.restore();
    scheduleStub = sinon
      .stub(batchDeleteHandler, 'scheduleNextPoll')
      .resolves();

    sentryStub = sinon.stub(Sentry, 'captureException');
    serverLoggerStub = sinon.stub(serverLogger, 'error');
  });

  it('sends an event when the class is initialized', () => {
    const eventSpy = sinon.spy(emitter, 'emit');
    sinon.stub(BatchDeleteHandler.prototype, 'pollQueue').resolves();
    new BatchDeleteHandler(emitter);
    expect(eventSpy.calledOnceWithExactly('pollBatchDelete')).toBe(true);
  });

  it('invokes listener when pollBatchDelete event is emitted', async () => {
    const listenerStub = sinon.stub(batchDeleteHandler, 'pollQueue').resolves();
    emitter.emit('pollBatchDelete');
    expect(listenerStub.callCount).toEqual(1);
  });

  it('schedules a poll event after some time if no messages returned', async () => {
    sinon.stub(SQSClient.prototype, 'send').resolves({ Messages: [] });
    await batchDeleteHandler.pollQueue();
    expect(scheduleStub.calledOnceWithExactly(300000)).toBe(true);
  });

  it('logs critical error if could not receive messages, and reschedules', async () => {
    const error = new Error(`You got Q'd`);
    sinon.stub(SQSClient.prototype, 'send').rejects(error);
    await batchDeleteHandler.pollQueue();
    expect(
      sentryStub.calledOnceWithExactly(error, {
        level: 'fatal' as SeverityLevel,
      }),
    ).toBe(true);
    expect(serverLoggerStub.callCount).toEqual(1);
    expect(scheduleStub.calledOnceWithExactly(300000)).toBe(true);
  });

  describe('With a message', () => {
    describe('pollQueue', () => {
      it('invokes highlightDataService if a message is returned from poll', async () => {
        const deleteStub = sinon
          .stub(HighlightsDataService.prototype, 'deleteByAnnotationIds')
          .resolves();
        sinon
          .stub(SQSClient.prototype, 'send')
          .resolves({ Messages: [{ Body: JSON.stringify(fakeMessageBody) }] });
        await batchDeleteHandler.pollQueue();
        expect(
          deleteStub.calledOnceWithExactly(
            ['1', '2', '3', '4', '5'],
            'abc-123',
          ),
        ).toBe(true);
      });
      it('schedules polling another message after a delay', async () => {
        sinon
          .stub(SQSClient.prototype, 'send')
          .resolves({ Messages: [{ Body: JSON.stringify(fakeMessageBody) }] });
        sinon.stub(batchDeleteHandler, 'handleMessage').resolves(true);
        sinon.stub(batchDeleteHandler, 'deleteMessage').resolves();
        await batchDeleteHandler.pollQueue();
        expect(scheduleStub.calledOnceWithExactly(30000)).toBe(true);
      });
      it('sends a delete if message was successfully processed', async () => {
        sinon.stub(batchDeleteHandler, 'handleMessage').resolves(true);
        const sqsStub = sinon
          .stub(SQSClient.prototype, 'send')
          .onFirstCall()
          .resolves({ Messages: [{ Body: JSON.stringify(fakeMessageBody) }] })
          .onSecondCall()
          .resolves();
        await batchDeleteHandler.pollQueue();
        expect(sqsStub.callCount).toEqual(2);
        expect(sqsStub.secondCall.args[0].input).toEqual(
          new DeleteMessageCommand({
            QueueUrl: config.aws.sqs.annotationsDeleteQueue.url,
            ReceiptHandle: undefined,
          }).input,
        );
      });
      it('does not delete if message was unsuccessfully processed', async () => {
        sinon.stub(batchDeleteHandler, 'handleMessage').resolves(false);
        const sqsStub = sinon
          .stub(SQSClient.prototype, 'send')
          .onFirstCall()
          .resolves({ Messages: [{ Body: JSON.stringify(fakeMessageBody) }] })
          .onSecondCall()
          .resolves();
        await batchDeleteHandler.pollQueue();
        expect(sqsStub.callCount).toEqual(1);
      });
    });

    describe('handleMessage', () => {
      it('sends error to Sentry and Cloudwatch if data service call fails, and schedules poll', async () => {
        const error = new Error(`You got Q'd`);
        sinon
          .stub(HighlightsDataService.prototype, 'deleteByAnnotationIds')
          .rejects(error);
        await batchDeleteHandler.handleMessage(fakeMessageBody);
        expect(sentryStub.calledOnceWithExactly(error)).toBe(true);
        expect(serverLoggerStub.callCount).toEqual(2);
      });
    });
  });
});
