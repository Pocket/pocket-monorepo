import type {
  SQSBatchResponse,
  SQSBatchItemFailure,
  SQSEvent,
} from 'aws-lambda';
import { EventPayload, validDetailTypes } from './types';
import { createDoc } from './createDoc';
import { config } from './config';
import fetchRetry from 'fetch-retry';
import * as Sentry from '@sentry/serverless';
import { serverLogger } from '@pocket-tools/ts-logger';
const newFetch = fetchRetry(fetch);

/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function processor(event: SQSEvent): Promise<SQSBatchResponse> {
  const validPayloads: Array<EventPayload> = event.Records.map((record) => {
    const message = JSON.parse(JSON.parse(record.body).Message);
    return {
      messageId: record.messageId,
      detailType: message['detail-type'],
      detail: message['detail'],
    };
  }).filter((message) => validDetailTypes.includes(message['detailType']));
  const result = await bulkIndex(validPayloads);
  return result;
}

export const handler = Sentry.AWSLambda.wrapHandler(processor);

/**
 * Make an HTTP request to the bulk index of elasticsearch to
 * index documents in corpora depending on language.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @returns the batch response with identifiers if any events failed
 */
export async function bulkIndex(
  records: EventPayload[],
): Promise<SQSBatchResponse> {
  const invalidLanguage = (item: EventPayload) => {
    const language =
      'collection' in item.detail
        ? item.detail.collection.language
        : item.detail.language;
    return language == null ||
      config.indexLangMap[language.toLowerCase()] == null
      ? true
      : false;
  };
  // Filter out any invalid languages
  const failures: SQSBatchItemFailure[] = records
    .filter((item) => invalidLanguage(item))
    .map((failure) => ({ itemIdentifier: failure.messageId }));
  const validItems = records.filter((item) => !invalidLanguage(item));
  // The new elasticsearch client doesn't work on AWS
  // The old one is honestly maybe more of a PITA than just making http
  // requests, because the typing is just 'any' where it counts and the
  // documentation is better for the http api anyway...
  const bodyData = validItems
    .flatMap((item) => createDoc(item))
    .flatMap((docCommands) => [{ index: docCommands.meta }, docCommands.fields])
    .map((line) => JSON.stringify(line))
    .join('\n');
  const body = `${bodyData}\n`; // must be terminated by a newline...
  const res = await newFetch(`${config.apiEndpoint}/_bulk`, {
    retryOn: [500, 502, 503],
    retryDelay: (attempt) => {
      return Math.pow(2, attempt) * 500;
    },
    retries: 3,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) {
    const data = await res.json();
    serverLogger.error({ message: 'Request failure', data: data });
    throw new Error(
      `user-list-search-corpus-index: ${res.status}\n${JSON.stringify(data.errors)}`,
    );
  } else {
    // Pull error data from response and log to Sentry
    const response = await res.json();
    if (response.errors === true) {
      const errorData = {};
      response.items.forEach((item, ix) => {
        if (item['index'].error != null) {
          failures.push({ itemIdentifier: validItems[ix].messageId });
          errorData[validItems[ix].messageId] = {
            payload: validItems[ix],
            error: item['index'].error,
          };
        }
        Sentry.captureEvent({
          message: 'Error indexing corpus item(s)',
          breadcrumbs: [{ data: errorData }],
        });
        serverLogger.error({
          message: 'Error indexing corpus item(s)',
          data: errorData,
        });
      });
    }
  }
  return { batchItemFailures: failures };
}
