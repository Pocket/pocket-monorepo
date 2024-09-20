import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.sentry.environment,
});
import type {
  SQSBatchResponse,
  SQSBatchItemFailure,
  SQSEvent,
} from 'aws-lambda';
import { EventPayload, ValidatedEventPayload, validDetailTypes } from './types';
import { createDoc, deleteDoc } from './docCommands';
import { postRetry } from './postRetry';
import { serverLogger } from '@pocket-tools/ts-logger';
import { syndicationDupes } from './syndication';

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

export const handler = Sentry.wrapHandler(processor);

/**
 * Make an HTTP request to the bulk index of elasticsearch to
 * index documents in corpora depending on language.
 * @param record SQSRecord containing forwarded event from eventbridge
 * @returns the batch response with identifiers if any events failed
 */
export async function bulkIndex(
  records: EventPayload[],
): Promise<SQSBatchResponse> {
  const validLanguage = (item: EventPayload): item is ValidatedEventPayload => {
    const language =
      'collection' in item.detail
        ? item.detail.collection.language
        : item.detail.language;
    return language == null ||
      config.indexLangMap[language.toLowerCase()] == null
      ? false
      : true;
  };
  // Filter out any invalid languages
  const failures: SQSBatchItemFailure[] = records
    .filter((item) => !validLanguage(item))
    .map((failure) => ({ itemIdentifier: failure.messageId }));
  const validItems: ValidatedEventPayload[] = records.filter((item) =>
    validLanguage(item),
  );
  // Delete syndication duplicates
  // This assumes that for a given syndicated article, the
  // original article existed in the corpus *before* it was
  // was syndicated. We do not check for a possible syndication
  // duplicate whenever a new article is added, because that would
  // be resource-intensive and generally doesn't make sense with the
  // curation workflow. We'll take the very small risk of duplicates
  // which can be deleted manually.
  const duplicates = await syndicationDupes(validItems);
  const deletes = duplicates
    .flatMap((doc) => deleteDoc(doc.id, doc.index))
    .map((line) => JSON.stringify(line))
    .join('\n');
  // The new elasticsearch client doesn't work on AWS
  // The old one is honestly maybe more of a PITA than just making http
  // requests, because the typing is just 'any' where it counts and the
  // documentation is better for the http api anyway...
  const bodyData = validItems
    .flatMap((item) => createDoc(item))
    .flatMap((docCommands) => [{ index: docCommands.meta }, docCommands.fields])
    .map((line) => JSON.stringify(line))
    .join('\n');
  const body = `${bodyData}\n${deletes}\n`; // must be terminated by a newline...
  const res = await postRetry(`${config.apiEndpoint}/_bulk`, body);
  if (!res.ok) {
    Sentry.addBreadcrumb({ data: { requestBody: body } });
    const data = await res.json();
    serverLogger.error({ message: 'Request failure', errorData: data });
    throw new Error(
      `user-list-search-corpus-index: ${res.status}\n${JSON.stringify(data.error)}`,
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
      });
      Sentry.addBreadcrumb({ data: errorData });
      Sentry.captureException('Error indexing corpus item(s)');
      serverLogger.error({
        message: 'Error indexing corpus item(s)',
        errorData,
      });
    }
  }
  return { batchItemFailures: failures };
}
