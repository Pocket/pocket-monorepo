import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { CorpusSearchConnection } from '../__generated__/types';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';
import { config } from '../config';

type SearchResultEvent = {};

enum PocketSearchEventType {
  created = 'search_result_created',
}

export class EventBus {
  constructor(private client: EventBridgeClient) {}
  private buildSearchResultEvent(
    input: CorpusSearchConnection,
  ): SearchResultEvent {
    return {};
  }
  private async send(
    payload: SearchResultEvent,
    eventType: PocketSearchEventType,
  ) {
    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.aws.eventBus.name,
          Detail: JSON.stringify({ pocketShare: payload }),
          Source: config.aws.eventBus.source,
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
  async sendResultEvent(input: CorpusSearchConnection) {
    const payload = this.buildSearchResultEvent(input);
    await this.send(payload, PocketSearchEventType.created);
  }
}
