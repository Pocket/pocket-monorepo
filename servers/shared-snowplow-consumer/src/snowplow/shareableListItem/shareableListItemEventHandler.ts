import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  ObjectUpdate,
  ShareableListItem,
  createShareableListItem,
} from '../../snowtype/snowplow';
import { ShareableListItemEvent } from '@pocket-tools/event-bridge';

/**
 * class to send `shareable-list-item-event` to snowplow
 */
export class ShareableListItemEventHandler extends EventHandler {
  constructor() {
    const tracker = getTracker(config.snowplow.appIds.shareableListsApi);
    super(tracker);
    return this;
  }

  /**
   * method to create and process event data
   * @param event
   */
  process(event: ShareableListItemEvent): void {
    const context: SelfDescribingJson[] =
      ShareableListItemEventHandler.generateEventContext(event);

    this.trackObjectUpdate(this.tracker, {
      ...ShareableListItemEventHandler.generateShareableListItemEvent(event),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   */
  private static generateShareableListItemEvent(
    event: ShareableListItemEvent,
  ): ObjectUpdate {
    return {
      trigger: event['detail-type'],
      object: 'shareable_list_item',
    };
  }

  private static generateEventContext(
    event: ShareableListItemEvent,
  ): SelfDescribingJson[] {
    return [
      createShareableListItem(
        ShareableListItemEventHandler.generateSnowplowShareableListItemEvent(
          event.detail.shareableListItem,
        ),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow shareable_list_item object schema.
   */
  private static generateSnowplowShareableListItemEvent(
    data: ShareableListItemEvent['detail']['shareableListItem'],
  ): ShareableListItem {
    return {
      shareable_list_item_external_id: data.shareable_list_item_external_id,
      shareable_list_external_id: data.shareable_list_external_id,
      given_url: data.given_url,
      title: data.title ?? undefined,
      excerpt: data.excerpt ?? undefined,
      image_url: data.image_url ?? undefined,
      authors: data.authors ?? undefined,
      publisher: data.publisher ?? undefined,
      note: data.note ?? undefined,
      sort_order: data.sort_order,
      created_at: data.created_at,
      updated_at: data.updated_at ?? undefined,
    };
  }
}
