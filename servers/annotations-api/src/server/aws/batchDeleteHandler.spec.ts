import { EventEmitter } from 'events';
import { BatchDeleteHandler, BatchDeleteMessage } from './batchDeleteHandler';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { HighlightsDataService } from '../../dataservices/highlights';
import * as Sentry from '@sentry/node';
import { SeverityLevel } from '@sentry/types';
import config from '../../config';
import { serverLogger } from '@pocket-tools/ts-logger';

describe('batchDeleteHandler', () => {
  const emitter = new EventEmitter();
  const batchDeleteHandler = new BatchDeleteHandler(emitter, false);
  const fakeMessageBody: BatchDeleteMessage = {
    traceId: 'abc-123',
    annotationIds: ['1', '2', '3', '4', '5'],
    userId: 123,
  };
  let scheduleStub: jest.SpyInstance;
  let sentryStub: jest.SpyInstance;
  let serverLoggerStub: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    scheduleStub = jest
      .spyOn(batchDeleteHandler, 'scheduleNextPoll')
      .mockImplementation();
    sentryStub = jest.spyOn(Sentry, 'captureException');
    serverLoggerStub = jest.spyOn(serverLogger, 'error');
  });

  it('sends an event when the class is initialized', () => {
    const eventSpy = jest.spyOn(emitter, 'emit').mockClear();
    jest.spyOn(BatchDeleteHandler.prototype, 'pollQueue');
    new BatchDeleteHandler(emitter);
    expect(eventSpy).toHaveBeenCalledWith('pollBatchDelete');
    expect(eventSpy).toBeCalledTimes(1);
  });

  it('invokes listener when pollBatchDelete event is emitted', async () => {
    const listenerStub = jest
      .spyOn(batchDeleteHandler, 'pollQueue')
      .mockResolvedValue();
    emitter.emit('pollBatchDelete');
    expect(listenerStub).toHaveBeenCalledTimes(1);
  });

  it('schedules a poll event after some time if no messages returned', async () => {
    jest.spyOn(SQSClient.prototype, 'send').mockReturnValue();
    await batchDeleteHandler.pollQueue();
    expect(scheduleStub).toHaveBeenCalledWith(300000);
    expect(scheduleStub).toBeCalledTimes(1);
  });

  it('logs critical error if could not receive messages, and reschedules', async () => {
    const error = new Error(`You got Q'd`);
    jest
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(() => Promise.reject(error));
    await batchDeleteHandler.pollQueue();
    expect(sentryStub).toHaveBeenCalledTimes(1);
    expect(sentryStub).toHaveBeenCalledWith(error, {
      level: 'fatal' as SeverityLevel,
    });
    expect(serverLoggerStub).toHaveBeenCalledTimes(1);
    expect(scheduleStub).toHaveBeenCalledWith(300000);
    expect(scheduleStub).toHaveBeenCalledTimes(1);
  });

  describe('With a message', () => {
    describe('pollQueue', () => {
      it('invokes highlightDataService if a message is returned from poll', async () => {
        const deleteStub = jest
          .spyOn(HighlightsDataService.prototype, 'deleteByAnnotationIds')
          .mockResolvedValue();
        jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() =>
          Promise.resolve({
            Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
          }),
        );
        await batchDeleteHandler.pollQueue();
        expect(deleteStub).toHaveBeenCalledWith(
          ['1', '2', '3', '4', '5'],
          'abc-123',
        );
        expect(deleteStub).toHaveBeenCalledTimes(1);
      });
      it('schedules polling another message after a delay', async () => {
        jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() =>
          Promise.resolve({
            Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
          }),
        );
        jest.spyOn(batchDeleteHandler, 'handleMessage').mockResolvedValue(true);
        jest.spyOn(batchDeleteHandler, 'deleteMessage').mockResolvedValue();
        await batchDeleteHandler.pollQueue();
        expect(scheduleStub).toHaveBeenCalledWith(30000);
        expect(scheduleStub).toHaveBeenCalledTimes(1);
      });
      it('sends a delete if message was successfully processed', async () => {
        jest.spyOn(batchDeleteHandler, 'handleMessage').mockResolvedValue(true);
        const sqsStub = jest
          .spyOn(SQSClient.prototype, 'send')
          .mockImplementationOnce(() =>
            Promise.resolve({
              Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
            }),
          )
          .mockImplementation(() => Promise.resolve());
        await batchDeleteHandler.pollQueue();
        expect(sqsStub).toHaveBeenCalledTimes(2);
        expect(sqsStub.mock.calls[1][0].input).toEqual(
          new DeleteMessageCommand({
            QueueUrl: config.aws.sqs.annotationsDeleteQueue.url,
            ReceiptHandle: undefined,
          }).input,
        );
      });
      it('does not delete if message was unsuccessfully processed', async () => {
        jest
          .spyOn(batchDeleteHandler, 'handleMessage')
          .mockResolvedValue(false);
        const sqsStub = jest
          .spyOn(SQSClient.prototype, 'send')
          .mockImplementationOnce(() =>
            Promise.resolve({
              Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
            }),
          )
          .mockImplementation(() => Promise.resolve());
        await batchDeleteHandler.pollQueue();
        expect(sqsStub).toHaveBeenCalledTimes(1);
      });
    });

    describe('handleMessage', () => {
      it('sends error to Sentry and Cloudwatch if data service call fails, and schedules poll', async () => {
        const error = new Error(`You got Q'd`);
        jest
          .spyOn(HighlightsDataService.prototype, 'deleteByAnnotationIds')
          .mockRejectedValue(error);
        await batchDeleteHandler.handleMessage(fakeMessageBody);
        expect(sentryStub).toHaveBeenCalledWith(error);
        expect(sentryStub).toHaveBeenCalledTimes(1);
        expect(serverLoggerStub).toHaveBeenCalledTimes(2);
      });
    });
  });
});
