import { config } from './config.ts';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.app.sentry.dsn,
  release: config.app.sentry.release,
  environment: config.app.environment,
  serverName: config.app.name,
});
import type {
  SQSEvent,
  SQSBatchResponse,
  SQSBatchItemFailure,
} from 'aws-lambda';

import { handlers } from './handlers/index.ts';
import { serverLogger } from '@pocket-tools/ts-logger';
import { sqsLambdaEventBridgeEvent } from '@pocket-tools/event-bridge';

/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function processor(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchFailures: SQSBatchItemFailure[] = [];
  for await (const record of event.Records) {
    try {
      const pocketEvent = sqsLambdaEventBridgeEvent(record);
      if (
        pocketEvent === null ||
        (pocketEvent !== null &&
          !Object.keys(handlers).includes(pocketEvent['detail-type']))
      ) {
        serverLogger.info(`Missing handler.`, {
          pocketEvent,
          data: record.body,
        });
        continue;
      }
      await handlers[pocketEvent['detail-type']](pocketEvent);
    } catch (error) {
      serverLogger.error({
        message: 'Failed to send request to Braze',
        errorData: error,
        errorMessage: error.message,
        request: record,
      });
      Sentry.captureException(error);
      batchFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures: batchFailures };
}

export const handler = Sentry.wrapHandler(processor);
