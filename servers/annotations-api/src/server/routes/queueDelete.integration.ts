import { readClient, writeClient } from '../../database/client';
import { SQS } from '@aws-sdk/client-sqs';
import { enqueueAnnotationIds, SqsMessage } from './queueDelete';
import { HighlightsDataService } from '../../dataservices/highlights';
import config from '../../config';
import * as Sentry from '@sentry/node';
import { Knex } from 'knex';

describe('/queueDelete', () => {
  let sentrySpy: jest.SpyInstance;
  let breadSpy: jest.SpyInstance;
  let sqsSendMock: jest.SpyInstance;
  let queryLimit, itemIdChunkSize, sqsBatchSize;
  let db: Knex;
  beforeAll(async () => {
    db = writeClient();

    await db('user_annotations').truncate();
    const data: {
      user_id: number;
      annotation_id: string;
      item_id: number;
      version: number;
      status: number;
      created_at: Date;
      updated_at: Date;
    }[] = [];
    for (let i = 1; i <= 6; i++) {
      const date = new Date(`2020-10-0${i} 10:20:30`);

      data.push({
        user_id: 1,
        annotation_id: `${i}`,
        item_id: i,
        version: 1,
        status: 1,
        created_at: date,
        updated_at: date,
      });
    }
    await db('user_annotations').insert(data);
    sentrySpy = jest.spyOn(Sentry, 'captureException').mockClear();
    breadSpy = jest.spyOn(Sentry, 'addBreadcrumb').mockClear();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(() => {
    queryLimit = config.queueDelete.queryLimit;
    itemIdChunkSize = config.queueDelete.itemIdChunkSize;
    sqsBatchSize = config.aws.sqs.batchSize;
  });

  afterEach(() => {
    config.queueDelete.queryLimit = queryLimit;
    config.queueDelete.itemIdChunkSize = itemIdChunkSize;
    config.aws.sqs.batchSize = sqsBatchSize;
    sentrySpy.mockReset();
    breadSpy.mockReset();
  });

  describe('enqueueAnnotationsId success', () => {
    beforeAll(() => {
      sqsSendMock?.mockRestore();
    });
    beforeEach(
      () =>
        (sqsSendMock = jest
          .spyOn(SQS.prototype, 'send')
          .mockImplementation(() => Promise.resolve())),
    );
    afterEach(() => sqsSendMock.mockRestore());
    it('sends batches of messages to sqs', async () => {
      config.queueDelete.queryLimit = 3;
      config.queueDelete.itemIdChunkSize = 3;
      config.aws.sqs.batchSize = 1;
      const userId = 1;
      const highlightsDataService = new HighlightsDataService({
        userId: '1',
        db: {
          writeClient: writeClient(),
          readClient: readClient(),
        },
        apiId: 'service', // unused but required for inheritance
        userIsPremium: false,
      });

      const data = {
        userId,
        email: 'test@yolo.com',
        isPremium: false,
      };

      await enqueueAnnotationIds(
        data as SqsMessage,
        highlightsDataService,
        '123',
      );

      expect(sqsSendMock).toHaveBeenCalledTimes(2);
      // No exceptions
      expect(sentrySpy).toHaveBeenCalledTimes(0);
      const firstMessage = JSON.parse(
        sqsSendMock.mock.calls[0][0].input.Entries[0].MessageBody,
      );
      const secondMessage = JSON.parse(
        sqsSendMock.mock.calls[1][0].input.Entries[0].MessageBody,
      );
      expect(firstMessage.traceId).toBeDefined();
      expect(firstMessage).toEqual({
        ...data,
        traceId: firstMessage.traceId, // no easy way to do a shallow equal, so we cheat.
        annotationIds: ['1', '2', '3'],
      });
      expect(secondMessage.traceId).toBeDefined();
      expect(secondMessage).toEqual({
        ...data,
        traceId: secondMessage.traceId, // no easy way to do a shallow equal, so we cheat.
        annotationIds: ['4', '5', '6'],
      });
    });
    it('sends batches of messages to sqs if email is not defined', async () => {
      config.queueDelete.queryLimit = 3;
      config.queueDelete.itemIdChunkSize = 3;
      config.aws.sqs.batchSize = 1;
      const userId = 1;
      const highlightsDataService = new HighlightsDataService({
        userId: '1',
        db: {
          writeClient: writeClient(),
          readClient: readClient(),
        },
        apiId: 'service', // unused but required for inheritance
        userIsPremium: false,
      });

      const data = {
        userId,
        isPremium: false,
      };

      await enqueueAnnotationIds(
        data as SqsMessage,
        highlightsDataService,
        '123',
      );

      expect(sqsSendMock).toHaveBeenCalledTimes(2);
      // No exceptions
      expect(sentrySpy).toHaveBeenCalledTimes(0);
      const firstMessage = JSON.parse(
        sqsSendMock.mock.calls[0][0].input.Entries[0].MessageBody,
      );
      const secondMessage = JSON.parse(
        sqsSendMock.mock.calls[1][0].input.Entries[0].MessageBody,
      );
      expect(firstMessage.traceId).toBeDefined();
      expect(firstMessage).toEqual({
        ...data,
        traceId: firstMessage.traceId, // no easy way to do a shallow equal, so we cheat.
        annotationIds: ['1', '2', '3'],
      });
      expect(secondMessage.traceId).toBeDefined();
      expect(secondMessage).toEqual({
        ...data,
        traceId: secondMessage.traceId, // no easy way to do a shallow equal, so we cheat.
        annotationIds: ['4', '5', '6'],
      });
    });
  });

  describe('enqueueAnnotationIds failure', () => {
    beforeAll(() => {
      sqsSendMock?.mockRestore();
    });
    beforeEach(() => {
      sqsSendMock = jest
        .spyOn(SQS.prototype, 'send')
        .mockImplementationOnce(() =>
          Promise.reject(new Error('no queue for you')),
        )
        .mockImplementationOnce(() => Promise.resolve());
    });
    afterEach(() => sqsSendMock.mockRestore());

    it('reports errors to Sentry when a batch fails, even if some succeed', async () => {
      config.queueDelete.queryLimit = 3;
      config.queueDelete.itemIdChunkSize = 3;
      config.aws.sqs.batchSize = 1;
      const userId = 1;
      const highlightsDataService = new HighlightsDataService({
        userId: '1',
        db: {
          writeClient: writeClient(),
          readClient: readClient(),
        },
        apiId: 'service', // unused but required for inheritance
        userIsPremium: false,
      });

      const data = {
        userId,
        email: 'test@yolo.com',
        isPremium: false,
      };

      await enqueueAnnotationIds(
        data as SqsMessage,
        highlightsDataService,
        '123',
      );

      // Two calls made
      expect(sqsSendMock).toHaveBeenCalledTimes(2);
      // Only one fails
      expect(sentrySpy).toHaveBeenCalledTimes(1);
      expect(sentrySpy.mock.calls[0][0].message).toEqual('no queue for you');
      expect(breadSpy).toHaveBeenCalledTimes(1);
      expect(breadSpy.mock.calls[0][0].message).toContain('QueueDelete: Error');
      expect(breadSpy.mock.calls[0][0].message).toContain('annotationIds');
    });
  });
});
