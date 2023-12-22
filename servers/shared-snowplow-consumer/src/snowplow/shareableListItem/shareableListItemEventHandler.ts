import { buildSelfDescribingEvent } from '@snowplow/node-tracker';
import { SelfDescribingJson } from '@snowplow/tracker-core';
import {
  ShareableListItem,
  ShareableListItemEventPayloadSnowplow,
  ObjectUpdate,
  shareableListItemEventSchema,
} from './types';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';

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
  process(data: ShareableListItemEventPayloadSnowplow): void {
    const event = buildSelfDescribingEvent({
      event: ShareableListItemEventHandler.generateShareableListItemEvent(data),
    });
    const context: SelfDescribingJson[] =
      ShareableListItemEventHandler.generateEventContext(data);
    super.addToTrackerQueue(event, context);
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   */
  private static generateShareableListItemEvent(
    data: ShareableListItemEventPayloadSnowplow
  ): ObjectUpdate {
    return {
      schema: shareableListItemEventSchema.objectUpdate,
      data: {
        trigger: data.eventType,
        object: 'shareable_list_item',
      },
    };
  }

  private static generateEventContext(
    data: ShareableListItemEventPayloadSnowplow
  ): SelfDescribingJson[] {
    return [
      ShareableListItemEventHandler.generateSnowplowShareableListItemEvent(
        data
      ),
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow shareable_list_item object schema.
   */
  private static generateSnowplowShareableListItemEvent(
    data: ShareableListItemEventPayloadSnowplow
  ): ShareableListItem {
    const snowplowEvent = {
      schema: shareableListItemEventSchema.shareable_list_item,
      data: {
        shareable_list_item_external_id:
          data.shareable_list_item.shareable_list_item_external_id,
        shareable_list_external_id:
          data.shareable_list_item.shareable_list_external_id,
        given_url: data.shareable_list_item.given_url,
        title: data.shareable_list_item.title
          ? data.shareable_list_item.title
          : undefined,
        excerpt: data.shareable_list_item.excerpt
          ? data.shareable_list_item.excerpt
          : undefined,
        image_url: data.shareable_list_item.image_url
          ? data.shareable_list_item.image_url
          : undefined,
        authors: data.shareable_list_item.authors
          ? data.shareable_list_item.authors
          : undefined,
        publisher: data.shareable_list_item.publisher
          ? data.shareable_list_item.publisher
          : undefined,
        note: data.shareable_list_item.note
          ? data.shareable_list_item.note
          : undefined,
        sort_order: data.shareable_list_item.sort_order,
        created_at: data.shareable_list_item.created_at,
        updated_at: data.shareable_list_item.updated_at
          ? data.shareable_list_item.updated_at
          : undefined,
      },
    };
    return snowplowEvent;
  }
}
