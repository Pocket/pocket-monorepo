import {
  ShareEvent,
  SharePocketEventType,
  PocketEventBridgeClient,
  PocketEventType,
} from '@pocket-tools/event-bridge';
import { PocketShare } from '../__generated__/types';
import { config } from '../config';

export class EventBus {
  constructor(private client: PocketEventBridgeClient) {}
  private buildShareEvent(
    input: PocketShare,
    type: SharePocketEventType,
  ): ShareEvent {
    return {
      'detail-type': type,
      source: config.aws.eventBus.source,
      detail: {
        pocketShare: {
          slug: input.slug,
          target_url: input.targetUrl,
          created_at: Math.round(input.createdAt.getTime() / 1000),
          note_length: input.context?.note?.length ?? 0,
          quote_count: input.context?.highlights?.length ?? 0,
        },
      },
    };
  }

  async sendCreateEvent(input: PocketShare) {
    const payload = this.buildShareEvent(input, PocketEventType.SHARE_CREATED);
    await this.client.sendPocketEvent(payload);
  }
  async sendUpdateEvent(input: PocketShare) {
    const payload = this.buildShareEvent(
      input,
      PocketEventType.SHARE_CONTEXT_UPDATED,
    );
    await this.client.sendPocketEvent(payload);
  }
}
