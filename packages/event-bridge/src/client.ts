import {
  EventBridgeClient,
  EventBridgeClientConfig,
  PutEventsCommand,
  PutEventsCommandOutput,
  PutEventsRequestEntry,
} from '@aws-sdk/client-eventbridge';
import { PocketEvent } from './events/index.ts';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';
import { OversizedEventError } from './errors.ts';

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
    const entry: PutEventsRequestEntry = {
      EventBusName: this.config.eventBus.name,
      Detail: JSON.stringify(event.detail),
      Source: event.source,
      DetailType: event['detail-type'],
    };

    try {
      this.validateEventSize(entry);
      const putEventCommand = new PutEventsCommand({
        Entries: [entry],
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
      Sentry.addBreadcrumb({
        data: { event },
        message: 'Failed to send event to event bridge',
      });
      Sentry.captureException(error);
      serverLogger.error(error, { event });
    }
  }

  /**
   * https://github.com/fredericbarthelet/typebridge/blob/master/src/Bus.ts#L87
   * Ensures that the event is not too large to send to EventBridge (256kb)
   * Otherwise throws an OversizedEventError
   * @param event Event to validate
   */
  validateEventSize(event: PutEventsRequestEntry) {
    const eventSize = this.computeEventSize(event);
    if (eventSize > 256000) {
      throw new OversizedEventError(event);
    }
  }

  /**
   *
   * Compute the size of an event in bytes
   * @param event Event to compute size of
   * @returns size of event in bytes
   */
  computeEventSize(event: PutEventsRequestEntry): number {
    let size = 0;

    if (event.Time) size += 14;
    if (event.Detail) size += Buffer.byteLength(event.Detail, 'utf8');
    if (event.DetailType) size += Buffer.byteLength(event.DetailType, 'utf8');
    if (event.Source) size += Buffer.byteLength(event.Source, 'utf8');
    if (event.Resources) {
      event.Resources.forEach((resource) =>
        Buffer.byteLength(resource, 'utf8'),
      );
    }

    return size;
  }
}
