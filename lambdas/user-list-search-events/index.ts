import { config } from './config.ts';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  ...config.sentry,
});
import { SQSEvent } from 'aws-lambda';
import { handlerMap } from './handlerMap.ts';
import { serverLogger } from '@pocket-tools/ts-logger';
import { sqsLambdaEventBridgeEvent } from '@pocket-tools/event-bridge';

/**
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function __handler(event: SQSEvent): Promise<any> {
  for await (const record of event.Records) {
    try {
      const pocketEvent = sqsLambdaEventBridgeEvent(record);
      // Ignore messages we don't have handlers for -- they can just pass through
      if (
        pocketEvent !== null &&
        Object.keys(handlerMap).includes(pocketEvent['detail-type'])
      ) {
        await handlerMap[pocketEvent['detail-type']](pocketEvent);
      }
    } catch (error) {
      serverLogger.error(error);
      Sentry.captureException(error, {
        data: {
          type: 'userListSearchEventHandler',
          error,
          event: JSON.stringify(event),
        },
      });
      throw error;
    }
  }
  return {};
}

export const handler = Sentry.wrapHandler(__handler, {
  captureTimeoutWarning: false,
});
