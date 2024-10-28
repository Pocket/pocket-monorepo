import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  ...config.sentry,
});
import type { SQSEvent } from 'aws-lambda';
import { instantSyncHandler } from './handlerFn';

/**
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
async function __handler(event: SQSEvent): Promise<any> {
  instantSyncHandler(event.Records);
}

export const handler = Sentry.wrapHandler(__handler, {
  captureTimeoutWarning: true,
});
