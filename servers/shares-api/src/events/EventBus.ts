import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { PocketShare } from '../__generated__/types';
import * as Sentry from '@Sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';
import { config } from '../config';

type PocketShareEvent = {
  target_url: string;
  created_at: number; // epoch time in seconds
  slug: string;
  note_length: number;
  quote_count: number;
};

enum PocketShareEventType {
  created = 'pocket_share_created',
  contextUpdated = 'pocket_share_context_updated',
}

export class EventBus {
  private static source = 'shares-api-events';
  constructor(private client: EventBridgeClient) {}
  private buildShareEvent(input: PocketShare): PocketShareEvent {
    return {
      slug: input.slug,
      target_url: input.targetUrl,
      created_at: Math.round(input.createdAt.getTime() / 1000),
      note_length: input.context?.note?.length ?? 0,
      quote_count: input.context?.highlights?.length ?? 0,
    };
  }
  private async send(
    payload: PocketShareEvent,
    eventType: PocketShareEventType,
  ) {
    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.aws.eventBus.name,
          Detail: JSON.stringify(payload),
          Source: EventBus.source,
          DetailType: eventType,
        },
      ],
    });
    try {
      await this.client.send(command);
    } catch (err) {
      Sentry.addBreadcrumb({
        data: { entries: command.input.Entries },
      });
      Sentry.captureException(err);
      serverLogger.error({
        error: 'Failed to send event to event bus',
        message: err.message,
        data: err,
      });
    }
  }
  async sendCreateEvent(input: PocketShare) {
    const payload = this.buildShareEvent(input);
    await this.send(payload, PocketShareEventType.created);
  }
  async sendUpdateEvent(input: PocketShare) {
    const payload = this.buildShareEvent(input);
    await this.send(payload, PocketShareEventType.contextUpdated);
  }
}
