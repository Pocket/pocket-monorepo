import { buildSelfDescribingEvent } from '@snowplow/node-tracker';
import { SelfDescribingJson } from '@snowplow/tracker-core';
import {
  ObjectUpdate,
  ProspectEventPayloadSnowplow,
  prospectEventSchema,
  ProspectReviewStatus,
  SnowplowEventMap,
} from './types';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';

type ObjectUpdateEvent = Omit<SelfDescribingJson, 'data'> & {
  data: ObjectUpdate;
};

type ProspectContext = Omit<SelfDescribingJson, 'data'> & {
  data: {
    object_version: string;
    prospect_id: string;
    url?: string;
    title?: string;
    excerpt?: string;
    image_url?: string;
    language?: string;
    topic?: string;
    is_collection?: boolean;
    is_syndicated?: boolean;
    authors?: string[];
    publisher?: string;
    domain?: string;
    prospect_source: string;
    scheduled_surface_id: string;
    created_at: number; // A Unix timestamp
    reviewed_by?: string;
    reviewed_at?: number; // A Unix timestamp
    prospect_review_status: ProspectReviewStatus;
  };
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
  process(data: ProspectEventPayloadSnowplow): void {
    const event = buildSelfDescribingEvent({
      event: ProspectEventHandler.generateProspectUpdateEvent(data),
    });
    const context = ProspectEventHandler.generateEventContext(data);
    super.addToTrackerQueue(event, context);
  }

  /**
   * @private
   */
  private static generateProspectUpdateEvent(
    data: ProspectEventPayloadSnowplow,
  ): ObjectUpdateEvent {
    return {
      schema: prospectEventSchema.objectUpdate,
      data: {
        trigger: SnowplowEventMap[data.eventType],
        object: 'prospect',
      },
    };
  }

  /**
   * @private to build event context for PROSPECT_REVIEWED event.
   */
  private static generateReviewedEventAccountContext(
    data: ProspectEventPayloadSnowplow,
  ): ProspectContext {
    return {
      schema: prospectEventSchema.prospect,
      data: {
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
      },
    };
  }

  private static generateEventContext(
    data: ProspectEventPayloadSnowplow,
  ): SelfDescribingJson[] {
    return [ProspectEventHandler.generateReviewedEventAccountContext(data)];
  }
}
