import { config } from './config.ts';
import * as Sentry from '@sentry/aws-serverless';
import { serverLogger } from '@pocket-tools/ts-logger';
import { BulkRequestPayload } from './types.ts';
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
  // We already had a method to create the bulk API
  // request over HTTP -- since this is the only request
  // in this service, it's not worth refactoring to use
  // the client
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
    Sentry.addBreadcrumb({ data: { requestBody: body } });
    const data = await res.json();
    serverLogger.error({ message: 'Request failure', errorData: data });
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
          errorData,
        });
      });
    }
  }
  return failedMessageIds;
}
