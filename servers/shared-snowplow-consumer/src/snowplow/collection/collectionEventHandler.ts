import { buildSelfDescribingEvent } from '@snowplow/node-tracker';
import { SelfDescribingJson } from '@snowplow/tracker-core';
import {
  CollectionEventPayloadSnowplow,
  CollectionStatus,
  CollectionLanguage,
  ObjectUpdate,
  SnowplowEventMap,
  CollectionAuthor,
  CollectionPartnership,
  CollectionStory,
  CurationCategory,
  IABChildCategory,
  IABParentCategory,
  Label,
  collectionEventSchema,
} from './types';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';

type ObjectUpdateEvent = Omit<SelfDescribingJson, 'data'> & {
  data: ObjectUpdate;
};

type CollectionContext = Omit<SelfDescribingJson, 'data'> & {
  data: {
    object_version: string;
    collection_id: string;
    slug: string;
    status: CollectionStatus;
    title: string;
    excerpt: string;
    labels: Label[];
    intro: string;
    image_url: string;
    authors: CollectionAuthor[];
    iab_parent_category: IABParentCategory;
    language: CollectionLanguage;
    curation_category: CurationCategory;
    partnership: CollectionPartnership;
    stories: CollectionStory[];
    published_at: number;
    created_at: number;
    updated_at: number;
    iab_child_category: IABChildCategory;
  };
};

/**
 * class to send `collection-event` to snowplow
 */
export class CollectionEventHandler extends EventHandler {
  constructor() {
    const tracker = getTracker(config.snowplow.appIds.collectionApi);
    super(tracker);
    return this;
  }

  /**
   * method to create and process event data
   * @param data
   */
  process(data: CollectionEventPayloadSnowplow): void {
    const event = buildSelfDescribingEvent({
      event: CollectionEventHandler.generateCollectionEvent(data),
    });
    const context: SelfDescribingJson[] =
      CollectionEventHandler.generateEventContext(data);
    super.addToTrackerQueue(event, context);
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   * Two possible trigger values are: collection_created and collection_updated
   */
  private static generateCollectionEvent(
    data: CollectionEventPayloadSnowplow,
  ): ObjectUpdateEvent {
    return {
      schema: collectionEventSchema.objectUpdate,
      data: {
        trigger: SnowplowEventMap[data.eventType],
        object: 'collection',
      },
    };
  }

  private static generateEventContext(
    data: CollectionEventPayloadSnowplow,
  ): SelfDescribingJson[] {
    return [CollectionEventHandler.generateSnowplowCollectionEvent(data)];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow collection object schema.
   */
  private static generateSnowplowCollectionEvent(
    data: CollectionEventPayloadSnowplow,
  ): CollectionContext {
    const snowplowEvent = {
      schema: collectionEventSchema.collection,
      data: {
        object_version: 'new',
        collection_id: data.collection.externalId,
        slug: data.collection.slug,
        status: data.collection.status,
        title: data.collection.title,
        excerpt: data.collection.excerpt,
        labels: data.collection.labels,
        intro: data.collection.intro,
        image_url: data.collection.imageUrl,
        authors: data.collection.authors,
        iab_parent_category: data.collection.IABParentCategory,
        language: data.collection.language,
        curation_category: data.collection.curationCategory,
        partnership: data.collection.partnership,
        stories: data.collection.stories,
        published_at: data.collection.publishedAt,
        created_at: data.collection.createdAt,
        updated_at: data.collection.updatedAt,
        iab_child_category: data.collection.IABChildCategory,
      },
    };
    return snowplowEvent;
  }
}
