import sinon from 'sinon';
import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './batchDeleteHandler';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { SqsMessage } from './routes/queueDelete';
import { AccountDeleteDataService } from './dataService/accountDeleteDataService';
import * as Sentry from '@sentry/node';
import { SeverityLevel } from '@sentry/types';
import { config } from './config';
import Logger from './logger';

describe('batchDeleteHandler', () => {
  const emitter = new EventEmitter();
  const batchDeleteHandler = new BatchDeleteHandler(emitter, false);
  const fakeMessageBody: SqsMessage = {
    traceId: 'abc-123',
    primaryKeyNames: ['surname'],
    primaryKeyValues: [['spock'], ['picard'], ['riker'], ['ohura']],
    userId: 123,
    tableName: 'officers',
    email: 'q@q.continuum',
    isPremium: true,
  };
  let scheduleStub: sinon.SinonStub;
  let sentryStub: sinon.SinonStub;
  let loggerError: sinon.SinonStub;

  beforeEach(() => {
    sinon.restore();
    scheduleStub = sinon
      .stub(batchDeleteHandler, 'scheduleNextPoll')
      .resolves();

    sentryStub = sinon.stub(Sentry, 'captureException');
    loggerError = sinon.stub(Logger, 'error');
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
    expect(loggerError.callCount).toEqual(1);
    expect(scheduleStub.calledOnceWithExactly(300000)).toBe(true);
  });
  describe('With a message', () => {
    describe('pollQueue', () => {
      it('invokes account delete data service if a message is returned from poll', async () => {
        const deleteStub = sinon
          .stub(
            AccountDeleteDataService.prototype,
            'batchDeleteUserInformation',
          )
          .resolves();
        sinon
          .stub(SQSClient.prototype, 'send')
          .resolves({ Messages: [{ Body: JSON.stringify(fakeMessageBody) }] });
        await batchDeleteHandler.pollQueue();
        expect(
          deleteStub.calledOnceWithExactly(
            'officers',
            {
              primaryKeyNames: ['surname'],
              primaryKeyValues: [['spock'], ['picard'], ['riker'], ['ohura']],
            },
            'abc-123',
            config.queueDelete.limitOverrides,
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
        expect(scheduleStub.calledOnceWithExactly(500)).toBe(true);
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
            QueueUrl: config.aws.sqs.accountDeleteQueue.url,
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
          .stub(
            AccountDeleteDataService.prototype,
            'batchDeleteUserInformation',
          )
          .rejects(error);
        await batchDeleteHandler.handleMessage(fakeMessageBody);
        expect(sentryStub.calledOnceWithExactly(error)).toBe(true);
        expect(loggerError.callCount).toEqual(1);
      });

      it('deletes from campaign_target_vars when campaign_target is deleted', async () => {
        const deleteStub = sinon
          .stub(
            AccountDeleteDataService.prototype,
            'batchDeleteUserInformation',
          )
          .resolves();

        const args = {
          primaryKeyNames: ['id'],
          primaryKeyValues: [[1], [2], [3], [4]],
        };

        const fakeMessageBody = {
          traceId: 'abc-123',
          userId: 123,
          tableName: 'readitla_ril-tmp.campaign_target',
          email: 'q@q.continuum',
          isPremium: true,
          ...args,
        };

        await batchDeleteHandler.handleMessage(fakeMessageBody);
        expect(deleteStub.calledTwice).toBe(true);
        const calls = deleteStub.getCalls();
        expect(calls[0].args).toStrictEqual([
          'readitla_ril-tmp.campaign_target',
          args,
          fakeMessageBody.traceId,
          config.queueDelete.limitOverrides,
        ]);
        expect(calls[1].args).toStrictEqual([
          'readitla_ril-tmp.campaign_target_vars',
          args,
          fakeMessageBody.traceId,
          config.queueDelete.limitOverrides,
        ]);
      });
    });
  });
});
