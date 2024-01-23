import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsCommandOutput,
} from '@aws-sdk/client-eventbridge';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';

/**
 * Shared class for wrapping put event command in EventBridge client
 * with Sentry exception capturing and Cloudwatch error.
 * Don't use this directly, but extend for event handlers that use
 * the AWS Event bus.
 */
export class EventBridgeBase {
  constructor(private client: EventBridgeClient) {}
  /**
   * Send a PutEventsCommand to EventBridge; capture failures and send
   * error data to Sentry and Cloudwatch
   * @param command PutEventsCommand
   */
  async putEvents(command: PutEventsCommand) {
    const failedEventError = new Error(
      `Failed to send event to event bus. Event Body:\n ${JSON.stringify(
        command.input['Entries'],
      )}`,
    );
    try {
      const output: PutEventsCommandOutput = await this.client.send(command);
      if (output.FailedEntryCount) {
        serverLogger.error(failedEventError);
        // Capture failed events in Sentry and Cloudwatch
        Sentry.captureException(failedEventError);
      }
    } catch (error) {
      serverLogger.error(
        failedEventError.message + ` OriginalError: ${error.message}`,
      );
      // Capture full client send failure in Sentry and Cloudwatch
      Sentry.captureException(failedEventError, {
        extra: { originalError: error.message },
      });
    }
  }
}
