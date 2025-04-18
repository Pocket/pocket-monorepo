import { config } from './config.ts';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.sentry.environment,
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
export async function processor(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchFailures: SQSBatchItemFailure[] = [];

  for await (const record of event.Records) {
    try {
      const message = JSON.parse(JSON.parse(record.body).Message);
      const handler = handlers[message['detail-type']];

      if (handler !== undefined) {
        await handler(record);
      }
    } catch (error) {
      serverLogger.error(error);
      Sentry.captureException(error);
      batchFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures: batchFailures };
}

export const handler = Sentry.wrapHandler(processor);
