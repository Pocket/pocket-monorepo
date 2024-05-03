import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config/index.js';
import { EventHandler } from '../EventHandler.js';
import { getTracker } from '../tracker.js';
import {
  ObjectUpdate,
  ShareableListItem,
  createShareableListItem,
} from '../../snowtype/snowplow.js';
import { ShareableListItemEventBridgePayload } from '../../eventConsumer/shareableListItemEvents/types.js';

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
   * @param data
   */
  process(data: ShareableListItemEventBridgePayload): void {
    const context: SelfDescribingJson[] =
      ShareableListItemEventHandler.generateEventContext(data);

    this.trackObjectUpdate(this.tracker, {
      ...ShareableListItemEventHandler.generateShareableListItemEvent(data),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   */
  private static generateShareableListItemEvent(
    data: ShareableListItemEventBridgePayload,
  ): ObjectUpdate {
    return {
      trigger: data['detail-type'],
      object: 'shareable_list_item',
    };
  }

  private static generateEventContext(
    data: ShareableListItemEventBridgePayload,
  ): SelfDescribingJson[] {
    return [
      createShareableListItem(
        ShareableListItemEventHandler.generateSnowplowShareableListItemEvent(
          data.detail.shareableListItem,
        ),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow shareable_list_item object schema.
   */
  private static generateSnowplowShareableListItemEvent(
    data: ShareableListItemEventBridgePayload['detail']['shareableListItem'],
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
