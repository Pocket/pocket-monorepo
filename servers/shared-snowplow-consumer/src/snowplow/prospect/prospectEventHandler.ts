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
  ProspectEvent,
  ProspectPocketEventType,
} from '@pocket-tools/event-bridge';

export const SnowplowEventMap: Record<
  ProspectPocketEventType,
  ObjectUpdateTrigger
> = {
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
   * method to create and process event event
   * @param event
   */
  process(event: ProspectEvent): void {
    const context: SelfDescribingJson[] =
      ProspectEventHandler.generateEventContext(event);

    this.trackObjectUpdate(this.tracker, {
      ...ProspectEventHandler.generateProspectUpdateEvent(event),
      context,
    });
  }

  /**
   * @private
   */
  private static generateProspectUpdateEvent(
    event: ProspectEvent,
  ): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[event['detail-type']],
      object: 'prospect',
    };
  }

  /**
   * @private to build event context for PROSPECT_REVIEWED event.
   */
  private static generateReviewedEventAccountContext(
    event: ProspectEvent['detail'],
  ): Prospect {
    return {
      object_version: 'new',
      prospect_id: event.prospectId,
      url: event.url,
      title: event.title,
      excerpt: event.excerpt,
      image_url: event.imageUrl,
      language: event.language,
      topic: event.topic,
      is_collection: event.isCollection,
      is_syndicated: event.isSyndicated,
      authors: event.authors.split(','),
      publisher: event.publisher,
      domain: event.domain,
      prospect_source: event.prospectType,
      scheduled_surface_id: event.scheduledSurfaceGuid,
      created_at: event.createdAt,
      prospect_review_status: event.prospectReviewStatus,
      reviewed_by: event.reviewedBy,
      reviewed_at: event.reviewedAt,
    };
  }

  private static generateEventContext(
    event: ProspectEvent,
  ): SelfDescribingJson[] {
    return [
      createProspect(
        ProspectEventHandler.generateReviewedEventAccountContext(event.detail),
      ) as unknown as SelfDescribingJson,
    ];
  }
}
