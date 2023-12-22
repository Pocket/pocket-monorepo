import { expect } from 'chai';
import { ObjectUpdate, EventType, shareableListItemEventSchema } from './types';
import { ShareableListItemEventHandler } from './shareableListItemEventHandler';
import {
  testShareableListItemData,
  testPartialShareableListItemData,
} from './testData';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';

function assertValidSnowplowObjectUpdateEvents(
  events,
  triggers: ObjectUpdate['data']['trigger'][],
) {
  const parsedEvents = events
    .map(parseSnowplowData)
    .map((parsedEvent) => parsedEvent.data);

  expect(parsedEvents).to.include.deep.members(
    triggers.map((trigger) => ({
      schema: shareableListItemEventSchema.objectUpdate,
      data: { trigger: trigger, object: 'shareable_list_item' },
    })),
  );
}

function assertShareableListItemSchema(eventContext) {
  expect(eventContext.data).to.include.deep.members([
    {
      schema: shareableListItemEventSchema.shareable_list_item,
      data: {
        shareable_list_item_external_id:
          testShareableListItemData.shareable_list_item_external_id,
        shareable_list_external_id:
          testShareableListItemData.shareable_list_external_id,
        given_url: testShareableListItemData.given_url,
        title: testShareableListItemData.title,
        excerpt: testShareableListItemData.excerpt,
        image_url: testShareableListItemData.image_url,
        authors: testShareableListItemData.authors,
        publisher: testShareableListItemData.publisher,
        note: testShareableListItemData.note,
        sort_order: testShareableListItemData.sort_order,
        created_at: testShareableListItemData.created_at,
        updated_at: testShareableListItemData.updated_at,
      },
    },
  ]);
}

function assertPartialShareableListItemSchema(eventContext) {
  expect(eventContext.data).to.include.deep.members([
    {
      schema: shareableListItemEventSchema.shareable_list_item,
      data: {
        shareable_list_item_external_id:
          testPartialShareableListItemData.shareable_list_item_external_id,
        shareable_list_external_id:
          testPartialShareableListItemData.shareable_list_external_id,
        given_url: testPartialShareableListItemData.given_url,
        sort_order: testPartialShareableListItemData.sort_order,
        created_at: testPartialShareableListItemData.created_at,
      },
    },
  ]);
}

const testEventData = {
  shareable_list_item: {
    ...testShareableListItemData,
  },
};

const testPartialEventData = {
  shareable_list_item: {
    ...testPartialShareableListItemData,
  },
};

describe('ShareableListItemEventHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send shareable_list_item_created event to snowplow', async () => {
    new ShareableListItemEventHandler().process({
      ...testEventData,
      eventType: EventType.SHAREABLE_LIST_ITEM_CREATED,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).to.equal(1);
    expect(allEvents.good).to.equal(1);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListItemSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      [EventType.SHAREABLE_LIST_ITEM_CREATED],
    );
  });

  it('should send shareable_list_item_deleted event to snowplow', async () => {
    new ShareableListItemEventHandler().process({
      ...testEventData,
      eventType: EventType.SHAREABLE_LIST_ITEM_DELETED,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).to.equal(1);
    expect(allEvents.good).to.equal(1);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListItemSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      [EventType.SHAREABLE_LIST_ITEM_DELETED],
    );
  });

  it('should send shareable_list_item_updated event to snowplow', async () => {
    new ShareableListItemEventHandler().process({
      ...testEventData,
      eventType: EventType.SHAREABLE_LIST_ITEM_UPDATED,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).to.equal(1);
    expect(allEvents.good).to.equal(1);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertShareableListItemSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      [EventType.SHAREABLE_LIST_ITEM_UPDATED],
    );
  });

  it('should send shareable_list_item_deleted event with missing non-required fields to snowplow', async () => {
    new ShareableListItemEventHandler().process({
      ...testPartialEventData,
      eventType: EventType.SHAREABLE_LIST_ITEM_DELETED,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).to.equal(1);
    expect(allEvents.good).to.equal(1);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertPartialShareableListItemSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      [EventType.SHAREABLE_LIST_ITEM_DELETED],
    );
  });
});
