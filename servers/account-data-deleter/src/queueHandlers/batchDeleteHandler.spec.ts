import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './batchDeleteHandler';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { SqsMessage } from '../routes/queueDelete';
import { AccountDeleteDataService } from '../dataService/accountDeleteDataService';
import * as Sentry from '@sentry/node';
import { SeverityLevel } from '@sentry/types';
import { config } from '../config';
import { serverLogger } from '@pocket-tools/ts-logger';
import { mockUnleash } from '@pocket-tools/feature-flags-client';

describe('batchDeleteHandler', () => {
  const { unleash: mockClient, repo } = mockUnleash([]);
  const emitter = new EventEmitter();
  const batchDeleteHandler = new BatchDeleteHandler(emitter, false, mockClient);
  const fakeMessageBody: SqsMessage = {
    traceId: 'abc-123',
    primaryKeyNames: ['surname'],
    primaryKeyValues: [['spock'], ['picard'], ['riker'], ['ohura']],
    userId: 123,
    tableName: 'officers',
    email: 'q@q.continuum',
    isPremium: true,
  };
  let scheduleStub: jest.SpyInstance;
  let sentryStub: jest.SpyInstance;
  let loggerError: jest.SpyInstance;

  const deleteFeatureToggle = {
    name: config.unleash.flags.deletesDisabled.name,
    stale: false,
    type: 'release',
    project: 'default',
    variants: [],
    strategies: [],
    impressionData: false,
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    scheduleStub = jest
      .spyOn(batchDeleteHandler, 'scheduleNextPoll')
      .mockResolvedValue();
    sentryStub = jest.spyOn(Sentry, 'captureException');
    loggerError = jest.spyOn(serverLogger, 'error');
  });
  afterAll(() => {
    mockClient.destroy();
  });
  describe('with feature flags', () => {
    describe('killswitch enabled', () => {
      beforeAll(() => {
        repo.setToggle(config.unleash.flags.deletesDisabled.name, {
          ...deleteFeatureToggle,
          enabled: true,
        });
      });
      it('does not process any messages if kill switch is enabled, and schedules new poll', async () => {
        const sendSpy = jest
          .spyOn(SQSClient.prototype, 'send')
          .mockImplementation(() => Promise.resolve());
        await batchDeleteHandler.pollQueue();
        expect(sendSpy).not.toHaveBeenCalled();
        expect(scheduleStub).toHaveBeenCalledOnce();
      });
    });
  });
  describe('without feature flags', () => {
    beforeAll(() => {
      repo.setToggle(config.unleash.flags.deletesDisabled.name, {
        ...deleteFeatureToggle,
        enabled: false,
      });
    });
    it('sends an event when the class is initialized', () => {
      mockClient.destroy();
      const eventSpy = jest.spyOn(emitter, 'emit').mockClear();
      jest.spyOn(BatchDeleteHandler.prototype, 'pollQueue').mockResolvedValue();
      new BatchDeleteHandler(emitter);
      expect(eventSpy).toHaveBeenCalledWith('pollBatchDelete');
    });
    it('invokes listener when pollBatchDelete event is emitted', async () => {
      const listenerStub = jest
        .spyOn(batchDeleteHandler, 'pollQueue')
        .mockResolvedValue();
      emitter.emit('pollBatchDelete');
      expect(listenerStub).toHaveBeenCalledTimes(1);
    });
    it('schedules a poll event after some time if no messages returned', async () => {
      jest
        .spyOn(SQSClient.prototype, 'send')
        .mockImplementation(() => Promise.resolve({ Messages: [] }));
      await batchDeleteHandler.pollQueue();
      expect(scheduleStub).toHaveBeenCalledWith(300000);
      expect(scheduleStub).toHaveBeenCalledTimes(1);
    });
    it('logs critical error if could not receive messages, and reschedules', async () => {
      const error = new Error(`You got Q'd`);
      jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() => {
        throw error;
      });
      await batchDeleteHandler.pollQueue();
      expect(sentryStub).toHaveBeenCalledWith(error, {
        level: 'fatal' as SeverityLevel,
      });
      expect(sentryStub).toHaveBeenCalledTimes(1);
      expect(loggerError).toHaveBeenCalledTimes(1);
      expect(scheduleStub).toHaveBeenCalledTimes(1);
      expect(scheduleStub).toHaveBeenCalledWith(300000);
    });

    describe('With a message', () => {
      describe('pollQueue', () => {
        it('invokes account delete data service if a message is returned from poll', async () => {
          const deleteStub = jest
            .spyOn(
              AccountDeleteDataService.prototype,
              'batchDeleteUserInformation',
            )
            .mockResolvedValue();
          jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() =>
            Promise.resolve({
              Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
            }),
          );
          await batchDeleteHandler.pollQueue();
          expect(deleteStub).toHaveBeenCalledWith(
            'officers',
            {
              primaryKeyNames: ['surname'],
              primaryKeyValues: [['spock'], ['picard'], ['riker'], ['ohura']],
            },
            'abc-123',
            config.queueDelete.limitOverrides,
          );
          expect(deleteStub).toHaveBeenCalledTimes(1);
        });
        it('schedules polling another message after a delay', async () => {
          jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() =>
            Promise.resolve({
              Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
            }),
          );
          jest
            .spyOn(batchDeleteHandler, 'handleMessage')
            .mockResolvedValue(true);
          jest.spyOn(batchDeleteHandler, 'deleteMessage').mockResolvedValue();
          await batchDeleteHandler.pollQueue();
          expect(scheduleStub).toHaveBeenCalledWith(500);
          expect(scheduleStub).toHaveBeenCalledTimes(1);
        });
        it('sends a delete if message was successfully processed', async () => {
          jest
            .spyOn(batchDeleteHandler, 'handleMessage')
            .mockResolvedValue(true);
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
              QueueUrl: config.aws.sqs.accountDeleteQueue.url,
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
            .spyOn(
              AccountDeleteDataService.prototype,
              'batchDeleteUserInformation',
            )
            .mockImplementation(() => {
              throw error;
            });
          await batchDeleteHandler.handleMessage(fakeMessageBody);
          expect(sentryStub).toHaveBeenCalledWith(error);
          expect(sentryStub).toHaveBeenCalledTimes(1);
          expect(loggerError).toHaveBeenCalledTimes(1);
        });

        it('deletes from campaign_target_vars when campaign_target is deleted', async () => {
          const deleteStub = jest
            .spyOn(
              AccountDeleteDataService.prototype,
              'batchDeleteUserInformation',
            )
            .mockResolvedValue();

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
          expect(deleteStub).toHaveBeenCalledTimes(2);
          const calls = deleteStub.mock.calls;
          expect(calls[0]).toStrictEqual([
            'readitla_ril-tmp.campaign_target',
            args,
            fakeMessageBody.traceId,
            config.queueDelete.limitOverrides,
          ]);
          expect(calls[1]).toStrictEqual([
            'readitla_ril-tmp.campaign_target_vars',
            args,
            fakeMessageBody.traceId,
            config.queueDelete.limitOverrides,
          ]);
        });
      });
    });
  });
});
