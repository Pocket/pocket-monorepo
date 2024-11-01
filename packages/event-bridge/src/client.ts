import {
  EventBridgeClient,
  EventBridgeClientConfig,
  PutEventsCommand,
  PutEventsCommandOutput,
} from '@aws-sdk/client-eventbridge';
import { PocketEvent } from './events';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';

export interface PocketEventBridgeConfig {
  aws?: EventBridgeClientConfig;
  eventBus: {
    name: string;
  };
}

export class PocketEventBridgeClient {
  private client: EventBridgeClient;

  constructor(private config: PocketEventBridgeConfig) {
    this.client = new EventBridgeClient(config.aws ?? {});
  }

  /**
   * Send event to Event Bus
   * Will not throw errors if event fails; instead, log exception to Sentry
   * and add to Cloudwatch logs.
   * @param eventPayload the payload to send to event bus
   */
  async sendPocketEvent(event: PocketEvent) {
    try {
      const putEventCommand = new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.config.eventBus.name,
            Detail: JSON.stringify(event.detail),
            Source: event.source,
            DetailType: event['detail-type'],
          },
        ],
      });
      const output: PutEventsCommandOutput =
        await this.client.send(putEventCommand);
      if (output.FailedEntryCount) {
        const failedEventError = new Error(
          `Failed to send event '${
            event['detail-type']
          }' to event bus. Event Body:\n ${JSON.stringify(event)}`,
        );
        // Don't halt program, but capture the failure in Sentry and our logs
        Sentry.captureException(failedEventError);
        serverLogger.error(failedEventError);
      }
    } catch (error) {
      // Don't halt program, but capture the failure in Sentry and our logs
      Sentry.captureException(error);
      serverLogger.error(error);
    }
  }
}
