import { SelfDescribingJson } from '@snowplow/tracker-core';
import { ProspectEventPayloadSnowplow, SnowplowEventMap } from './types';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  trackObjectUpdate,
  ObjectUpdate,
  createProspect,
  Prospect,
} from '../../snowtype/snowplow';

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
  process(data: ProspectEventPayloadSnowplow): void {
    const context: SelfDescribingJson[] =
      ProspectEventHandler.generateEventContext(data);

    trackObjectUpdate(this.tracker, {
      ...ProspectEventHandler.generateProspectUpdateEvent(data),
      context,
    });
  }

  /**
   * @private
   */
  private static generateProspectUpdateEvent(
    data: ProspectEventPayloadSnowplow,
  ): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[data.eventType],
      object: 'prospect',
    };
  }

  /**
   * @private to build event context for PROSPECT_REVIEWED event.
   */
  private static generateReviewedEventAccountContext(
    data: ProspectEventPayloadSnowplow,
  ): Prospect {
    return {
      object_version: 'new',
      prospect_id: data.prospect.prospectId,
      url: data.prospect.url,
      title: data.prospect.title,
      excerpt: data.prospect.excerpt,
      image_url: data.prospect.imageUrl,
      language: data.prospect.language,
      topic: data.prospect.topic,
      is_collection: data.prospect.isCollection,
      is_syndicated: data.prospect.isSyndicated,
      authors: data.prospect.authors.split(','),
      publisher: data.prospect.publisher,
      domain: data.prospect.domain,
      prospect_source: data.prospect.prospectType,
      scheduled_surface_id: data.prospect.scheduledSurfaceGuid,
      created_at: data.prospect.createdAt,
      prospect_review_status: data.prospect.prospectReviewStatus,
      reviewed_by: data.prospect.reviewedBy,
      reviewed_at: data.prospect.reviewedAt,
    };
  }

  private static generateEventContext(
    data: ProspectEventPayloadSnowplow,
  ): SelfDescribingJson[] {
    return [
      createProspect(
        ProspectEventHandler.generateReviewedEventAccountContext(data),
      ) as unknown as SelfDescribingJson,
    ];
  }
}
