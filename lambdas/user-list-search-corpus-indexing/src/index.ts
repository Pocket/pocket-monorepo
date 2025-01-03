import { config } from './config.ts';
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
import {
  ValidatedEventPayload,
  validDetailTypes,
  CollectionApprovedItemPayload,
  SyndicatedItemPayload,
  EventPayload,
} from './types.ts';
import { upsertCollection } from './commands/Collection.ts';
import { mergeCollection } from './commands/ApprovedItemCollection.ts';
import { upsertSyndicatedItem } from './commands/Syndicated.ts';
import { upsertApprovedItem } from './commands/ApprovedItem.ts';
import { postRetry } from './postRetry.ts';
import { serverLogger } from '@pocket-tools/ts-logger';
import { removeApprovedItem } from './commands/RemoveItem.ts';
import {
  PocketEventType,
  sqsLambdaEventBridgeEvent,
} from '@pocket-tools/event-bridge';

/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function processor(event: SQSEvent): Promise<SQSBatchResponse> {
  const validPayloads: Array<EventPayload> = event.Records.map((record) => {
    const pocketEvent = sqsLambdaEventBridgeEvent(record);
    if (
      pocketEvent == null ||
      !validDetailTypes.includes(pocketEvent['detail-type'])
    ) {
      return null;
    }
    return {
      messageId: record.messageId,
      detailType: event['detail-type'],
      detail: pocketEvent.detail,
    };
  }).filter((message) => message != null);
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

  // Build commands for bulk request in opensearch
  const commands: any[] = [];
  for await (const validItem of validItems) {
    // Deleting
    if (
      validItem.detailType === PocketEventType.CORPUS_ITEM_REMOVED &&
      // Not possible, but just for typescript...
      !('collection' in validItem.detail)
    ) {
      commands.push(...removeApprovedItem(validItem.detail));
    }
    // Indexing (create/update/replace)
    // Special cases - Collections
    else if ('collection' in validItem.detail) {
      commands.push(...upsertCollection(validItem.detail));
    }
    // Copies of Collections added to the Corpus
    else if (validItem.detail.isCollection === true) {
      commands.push(
        ...(await mergeCollection(
          // Narrowing/inference isn't working quite right
          validItem.detail as CollectionApprovedItemPayload,
        )),
      );
    }
    // Syndicated articles (which might be duplicated)
    else if (validItem.detail.isSyndicated === true) {
      commands.push(
        ...(await upsertSyndicatedItem(
          validItem.detail as SyndicatedItemPayload,
        )),
      );
    }
    // Default corpus item
    else {
      commands.push(...upsertApprovedItem(validItem.detail));
    }
  }

  // The REST API is better documented than the javascript client,
  // which doesn't have enough info about response errors
  const bodyData = commands
    .map((command) => JSON.stringify(command))
    .join('\n');
  const body = `${bodyData}\n`; // must be terminated by a newline...
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
        // Notify SQS of failure result
        failures.push({ itemIdentifier: validItems[ix].messageId });
        // Build error data for debugging
        Object.keys(item).forEach((operation) => {
          if (item[operation].error != null) {
            errorData[validItems[ix].messageId] = {
              payload: validItems[ix],
              operation,
              error: item[operation].error,
            };
          }
        });
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
