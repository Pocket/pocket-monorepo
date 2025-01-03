import { config } from './config.ts';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
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
/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function processor(
  event: SQSEvent,
): Promise<SQSBatchResponse | null> {
  const batchFailures: SQSBatchItemFailure[] = [];
  for await (const record of event.Records) {
    try {
      const message = JSON.parse(JSON.parse(record.body).Message);
      if (handlers[message['detail-type']] == null) {
        console.info(`No handler for detail-type='${message['detail-type']}'`);
        return null;
      }
      await handlers[message['detail-type']](record);
    } catch (error) {
      serverLogger.error(error);
      Sentry.captureException(error);
      batchFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures: batchFailures };
}

export const handler = Sentry.wrapHandler(processor);
