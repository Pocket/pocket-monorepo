import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  ...config.sentry,
});
import { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { handlerMap, PocketEventRecord } from './handlerMap';
import { sqsLambdaEventBridgeEvent } from '@pocket-tools/event-bridge';
import { serverLogger } from '@pocket-tools/ts-logger';

/**
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function __handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const failedRecordEventIds: string[] = [];

  // Reduce the events in the record to a map of detail-type to PocketEventRecord[] that we can then mass pass to the appropriate handler
  // string is actually PocketEventType but type enums didn't work here
  const parsedPocketEvents: Record<string, PocketEventRecord[]> =
    event.Records.map((record) => {
      try {
        const pocketEvent = sqsLambdaEventBridgeEvent(record);
        if (pocketEvent === null) {
          return null;
        }
        return {
          pocketEvent,
          messageId: record.messageId,
        };
      } catch (error) {
        serverLogger.error('Failed to parse record', error);
        failedRecordEventIds.push(record.messageId);
        return null;
      }
    })
      .filter((record) => record !== null)
      .filter((record) =>
        Object.keys(handlerMap).includes(record.pocketEvent['detail-type']),
      )
      .reduce((acc, eventRecord: PocketEventRecord) => {
        const detailType = eventRecord.pocketEvent['detail-type'];
        if (!acc[detailType]) {
          acc[detailType] = [];
        }
        acc[detailType].push(eventRecord);
        return acc;
      }, {});

  // For each detail-type, call the appropriate handler and save it to a list of promises we should await
  const promises: Promise<string[]>[] = [];
  for (const eventType of Object.keys(parsedPocketEvents)) {
    promises.push(handlerMap[eventType](parsedPocketEvents[eventType]));
  }

  // Await all the promises and collect any failed record event ids
  const responses = await Promise.all(promises);
  failedRecordEventIds.push(...responses.flat());

  return {
    batchItemFailures: failedRecordEventIds.map((id) => ({
      itemIdentifier: id,
    })),
  };
}

export const handler = Sentry.wrapHandler(__handler, {
  captureTimeoutWarning: false,
});
