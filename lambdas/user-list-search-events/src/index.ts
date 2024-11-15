import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  ...config.sentry,
});
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { handlerMap } from './handlerMap';
import {
  PocketEvent,
  PocketEventType,
  sqsLambdaEventBridgeEvent,
} from '@pocket-tools/event-bridge';
import { serverLogger } from '@pocket-tools/ts-logger';

/**
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function __handler(event: SQSEvent): Promise<any> {
  const failedRecords: SQSRecord[] = [];
  const parsedPocketEvents: PocketEvent[] = event.Records.map((record) => {
    try {
      return sqsLambdaEventBridgeEvent(record);
    } catch (error) {
      serverLogger.error('Failed to parse record', error);
      failedRecords.push(record);
      return null;
    }
  })
    .filter((pocketEvent) => pocketEvent !== null)
    .filter((pocketEvent) =>
      Object.keys(handlerMap).includes(pocketEvent['detail-type']),
    );

  const events: Record<PocketEventType, PocketEvent[]> =
    parsedPocketEvents.reduce((keyedObject, pocketEvent) => {
      if (!keyedObject[pocketEvent['detail-type']]) {
        keyedObject[pocketEvent['detail-type']] = [];
      }
      keyedObject[pocketEvent['detail-type']].push(pocketEvent);
      return keyedObject;
    });

  for (const eventType of Object.keys(events)) {
    const failedEvents = await handlerMap[eventType](events[eventType]);
  }
}

export const handler = Sentry.wrapHandler(__handler, {
  captureTimeoutWarning: false,
});
