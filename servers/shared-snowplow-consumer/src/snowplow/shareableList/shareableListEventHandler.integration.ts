import { ShareableListEventHandler } from './shareableListEventHandler';
import {
  testShareableListData,
  testPartialShareableListData,
} from './testData';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { ObjectUpdate } from '../../snowtype/snowplow';
import {
  PocketEventType,
  ShareableListPocketEventTypeEnum,
} from '@pocket-tools/event-bridge';

export const shareableListEventSchema = {
  objectUpdate: expect.stringMatching(
    'iglu:com.pocket/object_update/jsonschema',
  ),
  shareable_list: expect.stringMatching(
    'iglu:com.pocket/shareable_list/jsonschema',
  ),
};

function assertValidSnowplowObjectUpdateEvents(
  events,
  triggers: ObjectUpdate['trigger'][],
) {
  const parsedEvents = events
    .map(parseSnowplowData)
    .map((parsedEvent) => parsedEvent.data);

  expect(parsedEvents).toEqual(
    triggers.map((trigger) => ({
      schema: shareableListEventSchema.objectUpdate,
      data: { trigger: trigger, object: 'shareable_list' },
    })),
  );
}

function assertShareableListSchema(eventContext) {
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: shareableListEventSchema.shareable_list,
        data: {
          shareable_list_external_id:
            testShareableListData.shareable_list_external_id,
          user_id: testShareableListData.user_id,
          slug: testShareableListData.slug,
          title: testShareableListData.title,
          description: testShareableListData.description,
          status: testShareableListData.status,
          list_item_note_visibility:
            testShareableListData.list_item_note_visibility,
          moderation_status: testShareableListData.moderation_status,
          moderated_by: testShareableListData.moderated_by,
          moderation_reason: testShareableListData.moderation_reason,
          moderation_details: testShareableListData.moderation_details,
          restoration_reason: testShareableListData.restoration_reason,
          created_at: testShareableListData.created_at,
          updated_at: testShareableListData.updated_at,
        },
      },
    ]),
  );
}

function assertPartialShareableListSchema(eventContext) {
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: shareableListEventSchema.shareable_list,
        data: {
          shareable_list_external_id:
            testPartialShareableListData.shareable_list_external_id,
          user_id: testPartialShareableListData.user_id,
          title: testPartialShareableListData.title,
          status: testPartialShareableListData.status,
          list_item_note_visibility:
            testPartialShareableListData.list_item_note_visibility,
          moderation_status: testPartialShareableListData.moderation_status,
          created_at: testPartialShareableListData.created_at,
        },
      },
    ]),
  );
}

const testEventData = {
  detail: {
    eventType: ShareableListPocketEventTypeEnum.SHAREABLE_LIST_CREATED,
    shareableList: testShareableListData,
  },
};

const testPartialEventData = {
  detail: {
    eventType: ShareableListPocketEventTypeEnum.SHAREABLE_LIST_CREATED,
    shareableList: testPartialShareableListData,
  },
};

describe('ShareableListEventHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send shareable_list_created event to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_CREATED,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_created'],
    );
  });

  it('should send shareable_list_updated event to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_UPDATED,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_updated'],
    );
  });

  it('should send shareable_list_deleted event to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_DELETED,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_deleted'],
    );
  });

  it('should send shareable_list_published event to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_PUBLISHED,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_published'],
    );
  });

  it('should send shareable_list_unpublished event to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_UNPUBLISHED,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_unpublished'],
    );
  });

  it('should send shareable_list_hidden event to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_HIDDEN,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_hidden'],
    );
  });

  it('should send shareable_list_unhidden event to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_UNHIDDEN,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_unhidden'],
    );
  });

  it('should send shareable_list_created event with missing non-required fields to snowplow', async () => {
    new ShareableListEventHandler().process({
      ...testPartialEventData,
      'detail-type': PocketEventType.SHAREABLE_LIST_CREATED,
      source: 'shareable-list-events',
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertPartialShareableListSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['shareable_list_created'],
    );
  });
});
