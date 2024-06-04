import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
import { serverLogger } from '@pocket-tools/ts-logger';
import { BulkRequestPayload } from './types';
import fetchRetry from 'fetch-retry';
const newFetch = fetchRetry(fetch);
/**
 * Make an HTTP request to the bulk index of elasticsearch to
 * index documents in corpora depending on language.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @returns the batch response with identifiers if any events failed
 */
export async function bulkIndex(
  records: BulkRequestPayload[],
): Promise<string[]> {
  const failedMessageIds: string[] = [];
  // The new elasticsearch client doesn't work on AWS
  // The old one is honestly maybe more of a PITA than just making http
  // requests, because the typing is just 'any' where it counts and the
  // documentation is better for the http api anyway...
  const bodyData = records
    .flatMap((docCommands) => [
      { update: docCommands.meta },
      { doc: docCommands.fields },
    ])
    .map((line) => JSON.stringify(line))
    .join('\n');
  const body = `${bodyData}\n`; // must be terminated by a newline...
  const res = await newFetch(`${config.esEndpoint}/_bulk`, {
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
      `user-list-search-corpus-parser-hydrator: ${res.status}\n${JSON.stringify(data.error)}`,
    );
  } else {
    // Pull error data from response and log to Sentry
    const response = await res.json();
    if (response.errors === true) {
      const errorData = {};
      response.items.forEach((item, ix) => {
        if (item['update'].error != null) {
          failedMessageIds.push(records[ix].messageId);
          errorData[records[ix].messageId] = {
            payload: records[ix],
            error: item['update'].error,
          };
        }
        Sentry.captureEvent({
          message: 'Error updating corpus item(s)',
          breadcrumbs: [{ data: errorData }],
        });
        serverLogger.error({
          message: 'Error updating corpus item(s)',
          data: errorData,
        });
      });
    }
  }
  return failedMessageIds;
}
