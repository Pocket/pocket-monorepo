import fetch from 'node-fetch';
import {
  EventType,
  ItemsEventEmitter,
  SnowplowHandler,
} from '../../businessEvents/index.js';
import { tracker } from '../../snowplow/tracker.js';
import config from '../../config/index.js';
import { ListItemUpdate } from '../../snowplow/schema.js';
import { SavedItem } from '../../types/index.js';
import lodash from 'lodash';
const forEach = lodash.forEach;

async function snowplowRequest(path: string, post = false): Promise<any> {
  const response = await fetch(`http://${config.snowplow.endpoint}${path}`, {
    method: post ? 'POST' : 'GET',
  });
  return await response.json();
}

async function resetSnowplowEvents(): Promise<void> {
  await snowplowRequest('/micro/reset', true);
}

async function getAllSnowplowEvents(): Promise<{ [key: string]: any }> {
  return snowplowRequest('/micro/all');
}

async function getGoodSnowplowEvents(): Promise<{ [key: string]: any }> {
  return snowplowRequest('/micro/good');
}

function parseSnowplowData(data: string): { [key: string]: any } {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}

function assertValidSnowplowListItemUpdateEvents(
  events,
  triggers: ListItemUpdate['trigger'][],
) {
  const parsedEvents = events
    .map(parseSnowplowData)
    .map((parsedEvent) => parsedEvent.data);

  forEach(
    triggers.map((trigger) => ({
      schema: config.snowplow.schemas.listItemUpdate,
      data: { trigger: trigger },
    })),
    (e) => {
      expect(parsedEvents).toContainValue(e);
    },
  );
}

function assertValidSnowplowEventContext(data) {
  const eventContext = parseSnowplowData(data);
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: config.snowplow.schemas.listItem,
        data: {
          object_version: 'new',
          url: testSavedItem.url,
          item_id: parseInt(testSavedItem.id),
          status: 'unread',
          is_favorited: testSavedItem.isFavorite,
          tags: ['this', 'not', 'that'],
          created_at: testSavedItem._createdAt,
        },
      },
      {
        schema: config.snowplow.schemas.content,
        data: {
          url: testSavedItem.url,
          item_id: parseInt(testSavedItem.id),
        },
      },
      {
        schema: config.snowplow.schemas.user,
        data: { user_id: parseInt(eventData.user.id) },
      },
      {
        schema: config.snowplow.schemas.apiUser,
        data: { api_id: parseInt(eventData.apiUser.apiId) },
      },
    ]),
  );
}
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

const eventData = {
  user: { id: '1' },
  apiUser: { apiId: '1' },
  savedItem: Promise.resolve(testSavedItem),
  tags: Promise.resolve(['this', 'not', 'that']),
};

describe('SnowplowHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send good events to snowplow', async () => {
    const emitter = new ItemsEventEmitter();
    new SnowplowHandler(emitter, tracker, [
      EventType.ADD_ITEM,
      EventType.FAVORITE_ITEM,
    ]);
    emitter.emit(EventType.ADD_ITEM, {
      ...eventData,
      eventType: EventType.ADD_ITEM,
    });
    emitter.emit(EventType.FAVORITE_ITEM, {
      ...eventData,
      eventType: EventType.FAVORITE_ITEM,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(2);
    expect(allEvents.good).toBe(2);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    assertValidSnowplowEventContext(goodEvents[0].rawEvent.parameters.cx);
    assertValidSnowplowEventContext(goodEvents[1].rawEvent.parameters.cx);
    assertValidSnowplowListItemUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['save', 'favorite'],
    );
  });

  it('should capture tag-update events', async () => {
    const emitter = new ItemsEventEmitter();
    new SnowplowHandler(emitter, tracker, [
      EventType.ADD_TAGS,
      EventType.REPLACE_TAGS,
      EventType.REMOVE_TAGS,
      EventType.CLEAR_TAGS,
    ]);
    emitter.emit(EventType.ADD_TAGS, {
      ...eventData,
      eventType: EventType.ADD_TAGS,
    });
    emitter.emit(EventType.REPLACE_TAGS, {
      ...eventData,
      eventType: EventType.REPLACE_TAGS,
    });
    emitter.emit(EventType.REMOVE_TAGS, {
      ...eventData,
      eventType: EventType.REMOVE_TAGS,
    });
    emitter.emit(EventType.CLEAR_TAGS, {
      ...eventData,
      eventType: EventType.CLEAR_TAGS,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(4);
    expect(allEvents.good).toBe(4);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    goodEvents.forEach((goodEvent) =>
      assertValidSnowplowEventContext(goodEvent.rawEvent.parameters.cx),
    );
    assertValidSnowplowListItemUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['tags_update'],
    );
  });
});
