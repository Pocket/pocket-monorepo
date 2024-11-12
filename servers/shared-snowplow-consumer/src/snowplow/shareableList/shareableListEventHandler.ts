import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  ObjectUpdate,
  ShareableList,
  createShareableList,
} from '../../snowtype/snowplow';
import { ShareableListEvent } from '@pocket-tools/event-bridge';

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
  process(event: ShareableListEvent): void {
    const context: SelfDescribingJson[] =
      ShareableListEventHandler.generateEventContext(event);

    this.trackObjectUpdate(this.tracker, {
      ...ShareableListEventHandler.generateShareableListEvent(event),
      context,
    });
  }

  /**
   * Builds the Snowplow object_update event object. Extracts the event trigger type from the received payload.
   */
  private static generateShareableListEvent(
    event: ShareableListEvent,
  ): ObjectUpdate {
    return {
      trigger: event['detail-type'],
      object: 'shareable_list',
    };
  }

  private static generateEventContext(
    event: ShareableListEvent,
  ): SelfDescribingJson[] {
    return [
      createShareableList(
        ShareableListEventHandler.generateSnowplowShareableListEvent(
          event.detail.shareableList,
        ),
      ) as unknown as SelfDescribingJson,
    ];
  }

  /**
   * Static method to generate an object that maps properties received in the event payload object to the snowplow shareable_list object schema.
   */
  private static generateSnowplowShareableListEvent(
    data: ShareableListEvent['detail']['shareableList'],
  ): ShareableList {
    return {
      shareable_list_external_id: data.shareable_list_external_id,
      // user_id can be a big int, so we convert to a Number
      user_id: data.user_id ? Number(data.user_id) : undefined,
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
