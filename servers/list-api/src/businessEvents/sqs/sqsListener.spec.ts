import { SqsListener } from './sqsListener';
import { ItemsEventEmitter } from '../itemsEventEmitter';
import { SavedItem } from '../../types';
import { EventType } from '../types';
import config from '../../config';
import { sqs } from '../../aws/sqs';
import { serverLogger } from '@pocket-tools/ts-logger';

describe('SqsListener spec test', function () {
  function fakeSendError() {
    throw new Error('some SQS error');
  }

  let stub = null;
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
