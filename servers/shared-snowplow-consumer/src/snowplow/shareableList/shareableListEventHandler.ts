import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  trackObjectUpdate,
  ObjectUpdate,
  ShareableList,
  createShareableList,
} from '../../snowtype/snowplow';
import { ShareableListEventPayloadSnowplow, SnowplowEventMap } from './types';

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
  process(data: ShareableListEventPayloadSnowplow): void {
    const context: SelfDescribingJson[] =
      ShareableListEventHandler.generateEventContext(data);

    trackObjectUpdate(this.tracker, {
      ...ShareableListEventHandler.generateShareableListEvent(data),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   */
  private static generateShareableListEvent(
    data: ShareableListEventPayloadSnowplow,
  ): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[data.eventType],
      object: 'shareable_list',
    };
  }

  private static generateEventContext(
    data: ShareableListEventPayloadSnowplow,
  ): SelfDescribingJson[] {
    return [
      createShareableList(
        ShareableListEventHandler.generateSnowplowShareableListEvent(data),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow shareable_list object schema.
   */
  private static generateSnowplowShareableListEvent(
    data: ShareableListEventPayloadSnowplow,
  ): ShareableList {
    return {
      shareable_list_external_id:
        data.shareable_list.shareable_list_external_id,
      user_id: data.shareable_list.user_id
        ? data.shareable_list.user_id
        : undefined,
      slug: data.shareable_list.slug,
      title: data.shareable_list.title,
      description: data.shareable_list.description
        ? data.shareable_list.description
        : undefined,
      status: data.shareable_list.status,
      list_item_note_visibility: data.shareable_list.list_item_note_visibility,
      moderation_status: data.shareable_list.moderation_status,
      moderated_by: data.shareable_list.moderated_by
        ? data.shareable_list.moderated_by
        : undefined,
      moderation_reason: data.shareable_list.moderation_reason
        ? data.shareable_list.moderation_reason
        : undefined,
      moderation_details: data.shareable_list.moderation_details
        ? data.shareable_list.moderation_details
        : undefined,
      restoration_reason: data.shareable_list.restoration_reason
        ? data.shareable_list.restoration_reason
        : undefined,
      created_at: data.shareable_list.created_at,
      updated_at: data.shareable_list.updated_at
        ? data.shareable_list.updated_at
        : undefined,
    };
  }
}
