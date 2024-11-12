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
  CollectionEvent,
  CollectionPocketEventType,
} from '@pocket-tools/event-bridge';

export const SnowplowEventMap: Record<
  CollectionPocketEventType,
  ObjectUpdateTrigger
> = {
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
  process(event: CollectionEvent): void {
    const context: SelfDescribingJson[] =
      CollectionEventHandler.generateEventContext(event);

    this.trackObjectUpdate(this.tracker, {
      ...CollectionEventHandler.generateCollectionEvent(event),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   * Two possible trigger values are: collection_created and collection_updated
   */
  private static generateCollectionEvent(event: CollectionEvent): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[event['detail-type']],
      object: 'collection',
    };
  }

  private static generateEventContext(
    event: CollectionEvent,
  ): SelfDescribingJson[] {
    return [
      createCollection(
        CollectionEventHandler.generateSnowplowCollectionEvent(
          event.detail.collection,
        ),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow collection object schema.
   */
  private static generateSnowplowCollectionEvent(
    data: CollectionEvent['detail']['collection'],
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
