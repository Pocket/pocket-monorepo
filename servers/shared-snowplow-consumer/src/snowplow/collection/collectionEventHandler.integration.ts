import { EventType } from './types';
import { CollectionEventHandler } from './collectionEventHandler';
import { testCollectionData } from './testData';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { ObjectUpdate } from '../../snowtype/snowplow';

function assertValidSnowplowObjectUpdateEvents(
  events,
  triggers: ObjectUpdate['trigger'][],
) {
  const parsedEvents = events
    .map(parseSnowplowData)
    .map((parsedEvent) => parsedEvent.data);

  expect(parsedEvents).toEqual(
    triggers.map((trigger) => ({
      schema: 'iglu:com.pocket/object_update/jsonschema/1-0-16',
      data: { trigger: trigger, object: 'collection' },
    })),
  );
}

function assertCollectionSchema(eventContext) {
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: 'iglu:com.pocket/collection/jsonschema/1-0-3',
        data: {
          object_version: 'new',
          collection_id: testCollectionData.externalId,
          slug: testCollectionData.slug,
          title: testCollectionData.title,
          status: testCollectionData.status,
          language: testCollectionData.language,
          authors: testCollectionData.authors,
          stories: testCollectionData.stories,
          created_at: testCollectionData.createdAt,
          updated_at: testCollectionData.updatedAt,
          image_url: testCollectionData.imageUrl,
          labels: testCollectionData.labels,
          intro: testCollectionData.intro,
          curation_category: testCollectionData.curationCategory,
          excerpt: testCollectionData.excerpt,
          partnership: testCollectionData.partnership,
          published_at: testCollectionData.publishedAt,
          iab_parent_category: testCollectionData.IABParentCategory,
          iab_child_category: testCollectionData.IABChildCategory,
        },
      },
    ]),
  );
}

const testEventData = {
  object_version: 'new',
  collection: {
    ...testCollectionData,
  },
};

describe('CollectionEventHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send collection created event to snowplow ', async () => {
    new CollectionEventHandler().process({
      ...testEventData,
      eventType: EventType.COLLECTION_CREATED,
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

    assertCollectionSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['collection_created'],
    );
  });

  it('should send collection updated event to snowplow ', async () => {
    new CollectionEventHandler().process({
      ...testEventData,
      eventType: EventType.COLLECTION_UPDATED,
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

    assertCollectionSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['collection_updated'],
    );
  });
});
