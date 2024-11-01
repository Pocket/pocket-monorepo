import {
  ItemEventPayload,
  ItemsEventEmitter,
  initItemEventHandlers,
  eventBridgeEventHandler,
} from '../../businessEvents';
import { SavedItem } from '../../types';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import config from '../../config';
import {
  ListPocketEventTypeEnum,
  PocketEventType,
} from '@pocket-tools/event-bridge';

const testSavedItem: SavedItem = {
  id: '2',
  resolvedId: '2',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  isFavorite: true,
  isArchived: false,
  status: 'UNREAD',
  item: {
    givenUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  _createdAt: 1626389735,
};

const eventData: Omit<ItemEventPayload, 'eventType'> = {
  user: { id: '1', hashedId: 'abc123', isPremium: false },
  apiUser: { apiId: '1' },
  savedItem: testSavedItem,
  tags: ['this', 'not', 'that'],
  timestamp: 12345,
  source: 'list-api',
  version: 'v1',
};

describe('EventBridgeHandler', () => {
  const clientSpy = jest.spyOn(
    PocketEventBridgeClient.prototype,
    'sendPocketEvent',
  );
  const emitter = new ItemsEventEmitter();
  beforeAll(() => {
    initItemEventHandlers(emitter, [eventBridgeEventHandler]);
  });
  beforeEach(() => {
    clientSpy.mockClear();
  });
  afterAll(() => jest.restoreAllMocks());

  it('should emit events to event bridge successfully', async () => {
    const addEvent: ItemEventPayload = {
      ...eventData,
      eventType: PocketEventType.ADD_ITEM,
    };
    emitter.emit(PocketEventType.ADD_ITEM, addEvent);
    expect(clientSpy).toHaveBeenCalledTimes(1);
  });
  it('should contain the proper payload', async () => {
    const addEvent: ItemEventPayload = {
      ...eventData,
      eventType: PocketEventType.ADD_ITEM,
    };
    emitter.emit(PocketEventType.ADD_ITEM, addEvent);
    const expected = {
      detail: addEvent,
      source: config.serviceName,
      'detail-type': PocketEventType.ADD_ITEM,
    };
    expect(clientSpy).toHaveBeenCalledTimes(1);
    expect(clientSpy.mock.calls[0][0]).toMatchObject(expected);
  });
  it('should work for every event type', async () => {
    const eventTypes = Object.keys(ListPocketEventTypeEnum) as Array<
      keyof typeof ListPocketEventTypeEnum
    >;
    const eventBuilder = (
      eventType: keyof typeof ListPocketEventTypeEnum,
    ): ItemEventPayload => ({
      ...eventData,
      eventType: PocketEventType[eventType],
    });
    // Ensure that the proper number of assertions were called
    // So that there isn't a false positive if the for loop breaks
    expect.assertions(eventTypes.length);
    let callCount = 0;
    eventTypes.forEach((eventType) => {
      emitter.emit(PocketEventType[eventType], eventBuilder(eventType));
      callCount += 1;
      expect(clientSpy).toHaveBeenCalledTimes(callCount);
    });
  });
});
