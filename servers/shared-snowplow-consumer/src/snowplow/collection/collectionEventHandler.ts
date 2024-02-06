import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  Collection,
  ObjectUpdate,
  ObjectUpdateTrigger,
  createCollection,
} from '../../snowtype/snowplow';
import {
  CollectionEventBridgePayload,
  EventType,
} from '../../eventConsumer/collectionEvents/types';

export const SnowplowEventMap: Record<EventType, ObjectUpdateTrigger> = {
  'collection-created': 'collection_created',
  'collection-updated': 'collection_updated',
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
  process(data: CollectionEventBridgePayload): void {
    const context: SelfDescribingJson[] =
      CollectionEventHandler.generateEventContext(data);

    this.trackObjectUpdate(this.tracker, {
      ...CollectionEventHandler.generateCollectionEvent(data),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   * Two possible trigger values are: collection_created and collection_updated
   */
  private static generateCollectionEvent(
    data: CollectionEventBridgePayload,
  ): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[data['detail-type']],
      object: 'collection',
    };
  }

  private static generateEventContext(
    data: CollectionEventBridgePayload,
  ): SelfDescribingJson[] {
    return [
      createCollection(
        CollectionEventHandler.generateSnowplowCollectionEvent(
          data.detail.collection,
        ),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow collection object schema.
   */
  private static generateSnowplowCollectionEvent(
    data: CollectionEventBridgePayload['detail']['collection'],
  ): Collection {
    return {
      object_version: 'new',
      collection_id: data.externalId,
      slug: data.slug,
      status: data.status,
      title: data.title,
      excerpt: data.excerpt,
      labels: data.labels,
      intro: data.intro,
      image_url: data.imageUrl,
      authors: data.authors,
      iab_parent_category: data.IABParentCategory,
      language: data.language,
      curation_category: data.curationCategory,
      partnership: data.partnership,
      stories: data.stories,
      published_at: data.publishedAt,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
      iab_child_category: data.IABChildCategory,
    };
  }
}
