import * as Sentry from '@sentry/serverless';
import { SQSEvent } from 'aws-lambda';
import { config } from './config.js';
import { instantSyncHandler } from './handlerFn.js';

Sentry.AWSLambda.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

/**
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
async function __handler(event: SQSEvent): Promise<any> {
  instantSyncHandler(event.Records);
}

export const handler = Sentry.AWSLambda.wrapHandler(__handler, {
  captureTimeoutWarning: false,
});
