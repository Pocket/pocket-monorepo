import { EventEmitter } from 'events';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { BatchImportHandler } from './batchImportHandler';
import * as Sentry from '@sentry/node';
import { SeverityLevel } from '@sentry/types';
import config from '../config';
import { serverLogger } from '@pocket-tools/ts-logger';
import { mockUnleash } from '@pocket-tools/feature-flags-client';
import { PayloadType } from 'unleash-client';
import { ImportMessage } from './types';

describe('batchImportHandler', () => {
  const { unleash: mockClient, repo } = mockUnleash([]);
  const emitter = new EventEmitter();
  const batchImportHandler = new BatchImportHandler(emitter, false, mockClient);
  const fakeMessageBody: ImportMessage<'omnivore'> = {
    userId: '12345',
    importer: 'omnivore',
    records: [
      {
        id: '123-asdf',
        slug: 'slug',
        title: 'title',
        description: null,
        author: null,
        url: 'http://localhost.com',
        state: 'Active',
        readingProgress: 0,
        thumbnail: null,
        labels: [],
        savedAt: '2024-10-30T12:39:28.023Z',
        updatedAt: '2024-10-30T12:39:28.023Z',
        publishedAt: null,
      },
    ],
  };
  let scheduleStub: jest.SpyInstance;
  let sentryStub: jest.SpyInstance;
  let loggerError: jest.SpyInstance;

  const deleteFeatureToggle = {
    name: config.unleash.flags.importDisabled.name,
    stale: false,
    type: 'release',
    project: 'default',
    variants: [],
    strategies: [],
    impressionData: false,
  };

  const pollFlag = 'perm.backend.batch-import-poll-interval';
  const intervalSecondsToggle = {
    name: pollFlag,
    enabled: true,
    stale: false,
    impressionData: false,
    variants: [
      {
        name: 'intervalSeconds',
        weight: 1000,
        payload: {
          type: PayloadType.NUMBER,
          value: '27',
        },
      },
    ],
    strategies: [
      {
        name: 'default',
        parameters: {
          rollout: 100,
        },
        constraints: [],
      },
    ],
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    scheduleStub = jest
      .spyOn(batchImportHandler, 'scheduleNextPoll')
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
        repo.setToggle(config.unleash.flags.importDisabled.name, {
          ...deleteFeatureToggle,
          enabled: true,
        });
        repo.setToggle(pollFlag, {
          ...intervalSecondsToggle,
          enabled: false,
        });
      });
      it('does not process any messages if kill switch is enabled, and schedules new poll', async () => {
        const sendSpy = jest
          .spyOn(SQSClient.prototype, 'send')
          .mockImplementation(() => Promise.resolve());
        await batchImportHandler.pollQueue();
        expect(sendSpy).not.toHaveBeenCalled();
        expect(scheduleStub).toHaveBeenCalledOnce();
      });
    });
    describe('with interval overrides', () => {
      beforeAll(() => {
        repo.setToggle(config.unleash.flags.importDisabled.name, {
          ...deleteFeatureToggle,
          enabled: false,
        });
        repo.setToggle(pollFlag, intervalSecondsToggle);
      });
      it('schedules a new poll with value from unleash after message received', async () => {
        jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() =>
          Promise.resolve({
            Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
          }),
        );
        jest.spyOn(batchImportHandler, 'handleMessage').mockResolvedValue(true);
        jest.spyOn(batchImportHandler, 'deleteMessage').mockResolvedValue();
        await batchImportHandler.pollQueue();
        expect(scheduleStub).toHaveBeenCalledExactlyOnceWith(27000);
      });
    });
  });
  describe('without feature flags', () => {
    beforeAll(() => {
      repo.setToggle(config.unleash.flags.importDisabled.name, {
        ...deleteFeatureToggle,
        enabled: false,
      });
      repo.setToggle(pollFlag, {
        ...intervalSecondsToggle,
        enabled: false,
      });
    });
    it('sends an event when the class is initialized', () => {
      mockClient.destroy();
      const eventSpy = jest.spyOn(emitter, 'emit').mockClear();
      jest.spyOn(BatchImportHandler.prototype, 'pollQueue').mockResolvedValue();
      new BatchImportHandler(emitter);
      expect(eventSpy).toHaveBeenCalledWith('pollBatchImport');
    });
    it('invokes listener when pollBatchImport event is emitted', async () => {
      const listenerStub = jest
        .spyOn(batchImportHandler, 'pollQueue')
        .mockResolvedValue();
      emitter.emit('pollBatchImport');
      expect(listenerStub).toHaveBeenCalledTimes(1);
    });
    it('schedules a poll event after some time if no messages returned', async () => {
      jest
        .spyOn(SQSClient.prototype, 'send')
        .mockImplementation(() => Promise.resolve({ Messages: [] }));
      await batchImportHandler.pollQueue();
      expect(scheduleStub).toHaveBeenCalledWith(300000);
      expect(scheduleStub).toHaveBeenCalledTimes(1);
    });
    it('logs critical error if could not receive messages, and reschedules', async () => {
      const error = new Error(`You got Q'd`);
      jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() => {
        throw error;
      });
      await batchImportHandler.pollQueue();
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
          const importStub = jest
            .spyOn(BatchImportHandler.prototype, 'makeRequest')
            .mockResolvedValue(true);
          jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() =>
            Promise.resolve({
              Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
            }),
          );
          await batchImportHandler.pollQueue();
          expect(importStub).toHaveBeenCalledOnce();
        });
        it('schedules polling another message after a delay', async () => {
          jest.spyOn(SQSClient.prototype, 'send').mockImplementation(() =>
            Promise.resolve({
              Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
            }),
          );
          jest
            .spyOn(batchImportHandler, 'handleMessage')
            .mockResolvedValue(true);
          jest.spyOn(batchImportHandler, 'deleteMessage').mockResolvedValue();
          await batchImportHandler.pollQueue();
          expect(scheduleStub).toHaveBeenCalledWith(
            config.aws.sqs.batchImportQueue.afterMessagePollIntervalSeconds *
              1000,
          );
          expect(scheduleStub).toHaveBeenCalledTimes(1);
        });
        it('sends a delete if message was successfully processed', async () => {
          jest
            .spyOn(batchImportHandler, 'handleMessage')
            .mockResolvedValue(true);
          const sqsStub = jest
            .spyOn(SQSClient.prototype, 'send')
            .mockImplementationOnce(() =>
              Promise.resolve({
                Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
              }),
            )
            .mockImplementation(() => Promise.resolve());
          await batchImportHandler.pollQueue();
          expect(sqsStub).toHaveBeenCalledTimes(2);
          expect(sqsStub.mock.calls[1][0].input).toEqual(
            new DeleteMessageCommand({
              QueueUrl: config.aws.sqs.batchImportQueue.url,
              ReceiptHandle: undefined,
            }).input,
          );
        });
        it('does not delete if message was unsuccessfully processed', async () => {
          jest
            .spyOn(batchImportHandler, 'handleMessage')
            .mockResolvedValue(false);
          const sqsStub = jest
            .spyOn(SQSClient.prototype, 'send')
            .mockImplementationOnce(() =>
              Promise.resolve({
                Messages: [{ Body: JSON.stringify(fakeMessageBody) }],
              }),
            )
            .mockImplementation(() => Promise.resolve());
          await batchImportHandler.pollQueue();
          expect(sqsStub).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
