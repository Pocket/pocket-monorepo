import { expect } from 'chai';
import { ObjectUpdate, EventType, collectionEventSchema } from './types';
import { CollectionEventHandler } from './collectionEventHandler';
import { testCollectionData } from './testData';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';

function assertValidSnowplowObjectUpdateEvents(
  events,
  triggers: ObjectUpdate['trigger'][]
) {
  const parsedEvents = events
    .map(parseSnowplowData)
    .map((parsedEvent) => parsedEvent.data);

  expect(parsedEvents).to.include.deep.members(
    triggers.map((trigger) => ({
      schema: collectionEventSchema.objectUpdate,
      data: { trigger: trigger, object: 'collection' },
    }))
  );
}

function assertCollectionSchema(eventContext) {
  expect(eventContext.data).to.include.deep.members([
    {
      schema: collectionEventSchema.collection,
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
  ]);
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
    expect(allEvents.total).to.equal(1);
    expect(allEvents.good).to.equal(1);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx
    );

    assertCollectionSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['collection_created']
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
    expect(allEvents.total).to.equal(1);
    expect(allEvents.good).to.equal(1);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();
    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx
    );

    assertCollectionSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['collection_updated']
    );
  });
});
