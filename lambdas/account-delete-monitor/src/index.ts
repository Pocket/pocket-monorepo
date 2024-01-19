import { SQSEvent, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';
import * as Sentry from '@sentry/serverless';
import { handlers } from './handlers';

/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function processor(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchFailures: SQSBatchItemFailure[] = [];
  console.log({
    message: 'Received event records.',
    data: { record: JSON.stringify(event.Records) },
  });
  for await (const record of event.Records) {
    try {
      const message = JSON.parse(JSON.parse(record.body).Message);
      console.log({
        message: 'Received record.',
        data: { record: JSON.stringify(message) },
      });
      if (handlers[message['detail-type']] == null) {
        console.error({
          message: 'Missing handler.',
          data: {
            'detail-type': message['detail-type'],
            record: JSON.stringify(message),
          },
        });
        continue;
      }
      await handlers[message['detail-type']](record);
    } catch (error) {
      console.error({
        message: 'Errored record.',
        error,
        data: {
          error,
          record: JSON.stringify(record),
        },
      });
      Sentry.captureException(error);
      batchFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures: batchFailures };
}

export const handler = Sentry.AWSLambda.wrapHandler(processor);
