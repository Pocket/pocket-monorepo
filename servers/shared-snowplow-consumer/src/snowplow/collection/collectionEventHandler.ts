import { SelfDescribingJson } from '@snowplow/tracker-core';
import { CollectionEventPayloadSnowplow, SnowplowEventMap } from './types';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  Collection,
  ObjectUpdate,
  createCollection,
  trackObjectUpdate,
} from '../../snowtype/snowplow';

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
    const context: SelfDescribingJson[] =
      CollectionEventHandler.generateEventContext(data);

    trackObjectUpdate(this.tracker, {
      ...CollectionEventHandler.generateCollectionEvent(data),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   * Two possible trigger values are: collection_created and collection_updated
   */
  private static generateCollectionEvent(
    data: CollectionEventPayloadSnowplow,
  ): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[data.eventType],
      object: 'collection',
    };
  }

  private static generateEventContext(
    data: CollectionEventPayloadSnowplow,
  ): SelfDescribingJson[] {
    return [
      createCollection(
        CollectionEventHandler.generateSnowplowCollectionEvent(data),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow collection object schema.
   */
  private static generateSnowplowCollectionEvent(
    data: CollectionEventPayloadSnowplow,
  ): Collection {
    return {
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
    };
  }
}
