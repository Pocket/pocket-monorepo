import { SqsListener } from './sqsListener.js';
import { ItemsEventEmitter } from '../itemsEventEmitter.js';
import { SavedItem } from '../../types/index.js';
import { EventType } from '../types.js';
import config from '../../config/index.js';
import { sqs } from '../../aws/sqs.js';
import { serverLogger } from '@pocket-tools/ts-logger';
import { jest } from '@jest/globals';
import { SpyInstance } from 'jest-mock';

describe('SqsListener spec test', function () {
  function fakeSendError() {
    throw new Error('some SQS error');
  }

  let stub: SpyInstance = null;
  afterAll(() => {
    stub.mockReset();
  });

  it('should log error when sqs send fails', async () => {
    const eventEmitter = new ItemsEventEmitter();
    stub = jest
      .spyOn(sqs, 'send')
      .mockClear()
      .mockImplementation(fakeSendError);
    const sqsListener = new SqsListener(eventEmitter, [
      {
        transformer: async (data) => data,
        queueUrl: config.aws.sqs.publisherQueue.url,
        events: [EventType.ADD_ITEM],
      },
    ]);
    const consoleSpy = jest.spyOn(serverLogger, 'error');

    const testSavedItem: SavedItem = {
      id: '1',
      resolvedId: '1',
      url: 'itemurl',
      isFavorite: false,
      isArchived: false,
      status: 'UNREAD',
      item: null,
    };

    const eventData = {
      user: { id: '1' },
      savedItem: Promise.resolve(testSavedItem),
      apiUser: { apiId: '1' },
      eventType: EventType.ADD_ITEM,
    };

    await sqsListener.process(config.aws.sqs.publisherQueue.url, eventData);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      `unable to add event to queue`,
    );
  });
});
