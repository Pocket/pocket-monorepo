import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  ObjectUpdate,
  createProspect,
  Prospect,
  ObjectUpdateTrigger,
} from '../../snowtype/snowplow';
import {
  EventType,
  ProspectEventBridgePayload,
} from '../../eventConsumer/prospectEvents/types';

export const SnowplowEventMap: Record<EventType, ObjectUpdateTrigger> = {
  'prospect-dismiss': 'prospect_reviewed',
};

/**
 * class to send `prospect-event` to snowplow
 */
export class ProspectEventHandler extends EventHandler {
  constructor() {
    const tracker = getTracker(config.snowplow.appIds.prospectApi);
    super(tracker);
    return this;
  }

  /**
   * method to create and process event data
   * @param data
   */
  process(data: ProspectEventBridgePayload): void {
    const context: SelfDescribingJson[] =
      ProspectEventHandler.generateEventContext(data);

    this.trackObjectUpdate(this.tracker, {
      ...ProspectEventHandler.generateProspectUpdateEvent(data),
      context,
    });
  }

  /**
   * @private
   */
  private static generateProspectUpdateEvent(
    data: ProspectEventBridgePayload,
  ): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[data['detail-type']],
      object: 'prospect',
    };
  }

  /**
   * @private to build event context for PROSPECT_REVIEWED event.
   */
  private static generateReviewedEventAccountContext(
    data: ProspectEventBridgePayload['detail'],
  ): Prospect {
    return {
      object_version: 'new',
      prospect_id: data.prospectId,
      url: data.url,
      title: data.title,
      excerpt: data.excerpt,
      image_url: data.imageUrl,
      language: data.language,
      topic: data.topic,
      is_collection: data.isCollection,
      is_syndicated: data.isSyndicated,
      authors: data.authors.split(','),
      publisher: data.publisher,
      domain: data.domain,
      prospect_source: data.prospectType,
      scheduled_surface_id: data.scheduledSurfaceGuid,
      created_at: data.createdAt,
      prospect_review_status: data.prospectReviewStatus,
      reviewed_by: data.reviewedBy,
      reviewed_at: data.reviewedAt,
    };
  }

  private static generateEventContext(
    data: ProspectEventBridgePayload,
  ): SelfDescribingJson[] {
    return [
      createProspect(
        ProspectEventHandler.generateReviewedEventAccountContext(data.detail),
      ) as unknown as SelfDescribingJson,
    ];
  }
}
