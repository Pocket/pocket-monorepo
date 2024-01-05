import { ItemsEventEmitter } from './itemsEventEmitter';
import { BasicItemEventPayloadWithContext, EventType } from './types';
import config from '../config';
import { SavedItem } from '../types';
import { getUnixTimestamp } from '../utils';

describe('ItemsEventEmitter', () => {
  const emitter = new ItemsEventEmitter();
  const date = new Date(2022, 9, 4, 15, 30);
  const unixDate = getUnixTimestamp(date);
  const handler = jest.fn();
  Object.values(EventType).forEach((event: string) =>
    emitter.on(event, handler),
  );

  const testSavedItem: SavedItem = {
    id: '5',
    resolvedId: '1',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    status: 'UNREAD',
    isFavorite: true,
    isArchived: false,
    item: { givenUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  };

  const payload: BasicItemEventPayloadWithContext = {
    savedItem: testSavedItem,
    user: { id: '1', isPremium: false },
    apiUser: { apiId: '2' },
  };

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeAll(() => {
    // Mock Date.now() to get a consistent date for inserting data
    jest.useFakeTimers({
      now: date,
      advanceTimers: false,
    });
  });

  afterEach(() => {
    handler.mockReset();
  });

  it('should emit an add item event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitItemEvent(EventType.ADD_ITEM, payload);
    const expectedData = {
      ...payload,
      eventType: 'ADD_ITEM',
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual(expectedData);
  });
  it('should emit an archive item event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitItemEvent(EventType.ARCHIVE_ITEM, payload);
    const expectedData = {
      ...payload,
      eventType: 'ARCHIVE_ITEM',
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual(expectedData);
  });
  it('should emit an unarchive item event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitItemEvent(EventType.UNARCHIVE_ITEM, payload);
    const expectedData = {
      ...payload,
      eventType: 'UNARCHIVE_ITEM',
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual(expectedData);
  });
  it('should emit an favorite item event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitItemEvent(EventType.FAVORITE_ITEM, payload);
    const expectedData = {
      ...payload,
      eventType: 'FAVORITE_ITEM',
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual(expectedData);
  });
  it('should emit an unfavorite item event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitItemEvent(EventType.UNFAVORITE_ITEM, payload);
    const expectedData = {
      ...payload,
      eventType: 'UNFAVORITE_ITEM',
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual(expectedData);
  });
  it('should emit a delete item event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitItemEvent(EventType.DELETE_ITEM, payload);
    const expectedData = {
      ...payload,
      eventType: 'DELETE_ITEM',
      timestamp: unixDate,
      source: config.events.source,
      version: config.events.version,
    };
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toEqual(expectedData);
  });
});
