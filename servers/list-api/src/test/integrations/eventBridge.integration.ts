import {
  EventType,
  ItemEventPayload,
  ItemsEventEmitter,
} from '../../businessEvents';
import sinon from 'sinon';
import { SavedItem } from '../../types';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import {
  initItemEventHandlers,
  eventBridgeEventHandler,
} from '../../businessEvents';
import config from '../../config';

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
  user: { id: '1', isPremium: false },
  apiUser: { apiId: '1' },
  savedItem: testSavedItem,
  tags: ['this', 'not', 'that'],
  timestamp: 12345,
  source: 'list-api',
  version: 'v1',
};

describe('EventBridgeHandler', () => {
  const clientSpy = sinon.spy(EventBridgeClient.prototype, 'send');
  const emitter = new ItemsEventEmitter();
  beforeAll(() => {
    initItemEventHandlers(emitter, [eventBridgeEventHandler]);
  });
  beforeEach(() => {
    clientSpy.resetHistory();
  });
  afterAll(() => sinon.restore());

  it('should emit events to event bridge successfully', async () => {
    const addEvent: ItemEventPayload = {
      ...eventData,
      eventType: EventType.ADD_ITEM,
    };
    emitter.emit(EventType.ADD_ITEM, addEvent);
    const res = await Promise.resolve(clientSpy.returnValues[0]);
    const expected = {
      $metadata: expect.objectContaining({
        httpStatusCode: 200,
        requestId: expect.toBeString(),
      }),
      Entries:
        expect.toBeArrayOfSize(1) &&
        expect.toIncludeSameMembers([
          {
            ErrorCode: undefined,
            ErrorMessage: undefined,
            EventId: expect.toBeString(),
          },
        ]),
      FailedEntryCount: 0,
    };
    expect(clientSpy.callCount).toEqual(1);
    expect(res).toMatchObject(expected);
  });
  it('should contain the proper payload', async () => {
    const addEvent: ItemEventPayload = {
      ...eventData,
      eventType: EventType.ADD_ITEM,
    };
    emitter.emit(EventType.ADD_ITEM, addEvent);
    const expected = {
      EventBusName: config.aws.eventBus.name,
      Detail: JSON.stringify(addEvent),
      Source: config.serviceName,
      DetailType: EventType.ADD_ITEM,
    };
    expect(clientSpy.callCount).toEqual(1);
    expect(clientSpy.getCall(0).args[0].input['Entries']).toIncludeSameMembers([
      expected,
    ]);
  });
  it('should work for every event type', async () => {
    const eventTypes = Object.keys(EventType) as Array<keyof typeof EventType>;
    const eventBuilder = (
      eventType: keyof typeof EventType,
    ): ItemEventPayload => ({
      ...eventData,
      eventType: EventType[eventType],
    });
    // Ensure that the proper number of assertions were called
    // So that there isn't a false positive if the for loop breaks
    expect.assertions(eventTypes.length);
    let callCount = 0;
    eventTypes.forEach((eventType) => {
      emitter.emit(EventType[eventType], eventBuilder(eventType));
      callCount += 1;
      expect(clientSpy.callCount).toEqual(callCount);
    });
  });
});
