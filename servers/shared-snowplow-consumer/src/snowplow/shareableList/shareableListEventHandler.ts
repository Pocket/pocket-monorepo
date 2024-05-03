import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config/index.js';
import { EventHandler } from '../EventHandler.js';
import { getTracker } from '../tracker.js';
import {
  ObjectUpdate,
  ShareableList,
  createShareableList,
} from '../../snowtype/snowplow.js';
import { ShareableListEventBridgePayload } from '../../eventConsumer/shareableListEvents/types.js';

/**
 * class to send `shareable-list-event` to snowplow
 */
export class ShareableListEventHandler extends EventHandler {
  constructor() {
    const tracker = getTracker(config.snowplow.appIds.shareableListsApi);
    super(tracker);
    return this;
  }

  /**
   * method to create and process event data
   * @param data
   */
  process(data: ShareableListEventBridgePayload): void {
    const context: SelfDescribingJson[] =
      ShareableListEventHandler.generateEventContext(data);

    this.trackObjectUpdate(this.tracker, {
      ...ShareableListEventHandler.generateShareableListEvent(data),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   */
  private static generateShareableListEvent(
    data: ShareableListEventBridgePayload,
  ): ObjectUpdate {
    return {
      trigger: data['detail-type'],
      object: 'shareable_list',
    };
  }

  private static generateEventContext(
    data: ShareableListEventBridgePayload,
  ): SelfDescribingJson[] {
    return [
      createShareableList(
        ShareableListEventHandler.generateSnowplowShareableListEvent(
          data.detail.shareableList,
        ),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow shareable_list object schema.
   */
  private static generateSnowplowShareableListEvent(
    data: ShareableListEventBridgePayload['detail']['shareableList'],
  ): ShareableList {
    return {
      shareable_list_external_id: data.shareable_list_external_id,
      user_id: data.user_id ?? undefined,
      slug: data.slug,
      title: data.title,
      description: data.description ?? undefined,
      status: data.status,
      list_item_note_visibility: data.list_item_note_visibility,
      moderation_status: data.moderation_status,
      moderated_by: data.moderated_by ?? undefined,
      moderation_reason: data.moderation_reason ?? undefined,
      moderation_details: data.moderation_details ?? undefined,
      restoration_reason: data.restoration_reason ?? undefined,
      created_at: data.created_at,
      updated_at: data.updated_at ?? undefined,
    };
  }
}
