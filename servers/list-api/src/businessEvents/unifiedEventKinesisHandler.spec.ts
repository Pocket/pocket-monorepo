import config from '../config/index.js';
import { EventType, unifiedEventTransformer } from './index.js';
import { SavedItem } from '../types/index.js';
import { getUnixTimestamp } from '../utils.js';
import { jest } from '@jest/globals';

describe('UnifiedEventHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const testSavedItem: SavedItem = {
    id: '2',
    resolvedId: '1',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    isFavorite: true,
    isArchived: false,
    status: 'UNREAD',
    item: {
      givenUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  };

  it('should include tagUpdated in kinesis payload for tagEvents', async () => {
    const eventStub = {
      source: config.events.source,
      version: config.events.version,
      user: { id: '1', isPremium: false },
      tagsUpdated: ['tagA', 'tagB'],
      apiUser: { apiId: '1' },
      eventType: EventType.ADD_TAGS,
      data: { abc: '123' },
      savedItem: testSavedItem,
      timestamp: Date.now(),
    };

    const expected = {
      type: 'user-item-tags-added',
      data: {
        user_id: parseInt(eventStub.user.id),
        item_id: parseInt(testSavedItem.id),
        api_id: parseInt(eventStub.apiUser.apiId),
        tags: eventStub.tagsUpdated,
      },
      timestamp: eventStub.timestamp,
      source: eventStub.source,
      version: eventStub.version,
    };

    const data = await unifiedEventTransformer(eventStub);
    expect(data).toEqual(expected);
  });

  it('should not include tagUpdated in kinesis payload for non-tag events', async () => {
    const eventStub = {
      source: config.events.source,
      version: config.events.version,
      user: { id: '1', isPremium: false },
      apiUser: { apiId: '1' },
      eventType: EventType.ADD_ITEM,
      tagsUpdated: ['tagA', 'tagB'],
      data: { abc: '123' },
      savedItem: testSavedItem,
      timestamp: getUnixTimestamp(),
    };

    const expected = {
      type: 'user-list-item-created',
      data: {
        user_id: parseInt(eventStub.user.id),
        item_id: parseInt(testSavedItem.id),
        api_id: parseInt(eventStub.apiUser.apiId),
      },
      timestamp: eventStub.timestamp,
      source: eventStub.source,
      version: eventStub.version,
    };

    const data = await unifiedEventTransformer(eventStub);
    expect(data).toEqual(expected);
  });
});
