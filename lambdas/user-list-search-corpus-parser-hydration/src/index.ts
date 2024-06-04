import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.sentry.environment,
});
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import {
  EventPayload,
  validDetailTypes,
  BulkRequestMeta,
  BulkRequestPayload,
} from './types';
import { parserRequest } from './parserRequest';
import { bulkIndex } from './bulkIndex';

/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function processor(event: SQSEvent): Promise<SQSBatchResponse> {
  const failedMessageIds: string[] = [];

  const validPayloads: Array<EventPayload> = event.Records.map((record) => {
    const message = JSON.parse(JSON.parse(record.body).Message);
    return {
      messageId: record.messageId,
      detailType: message['detail-type'],
      detail: message['detail'],
    };
  })
    .filter((message) => validDetailTypes.includes(message['detailType']))
    .filter((message) => {
      const language =
        'collection' in message.detail
          ? message.detail.collection.language
          : message.detail.language;
      return !(
        language == null || config.indexLangMap[language.toLowerCase()] == null
      )
        ? true
        : false;
    });
  const parserRequests = validPayloads.flatMap((_) => unwrapPayloads(_));
  const parserResults: BulkRequestPayload[] = [];
  for await (const request of parserRequests) {
    const fields = await parserRequest(request.url);
    if (fields == null) {
      failedMessageIds.push(request.messageId);
    } else {
      parserResults.push({ ...request, fields });
    }
  }
  // Deduplicate failed messages since collections have multiple requests by same ID
  const indexFailures = await bulkIndex(parserResults);
  failedMessageIds.push(...indexFailures);
  const batchItemFailures = [...new Set(failedMessageIds)].map((id) => ({
    itemIdentifier: id,
  }));
  return { batchItemFailures };
}

/**
 * Unwrap messages into individual request payloads to be submitted to
 * the parser. This is because Collection events contain multiple stories,
 * each of which must be submitted individually (by URL).
 * @param payload the parsed event (SQS message)
 * @returns BulkRequestMeta - an object containing the metadata fields for
 * elasticsearch (the corpus and the object ID), as well as all the data
 * required for downstream request processing (the url for making the parser
 * request, and the messageId for reporting message processing failures)
 */
export function unwrapPayloads(payload: EventPayload): BulkRequestMeta[] {
  if ('collection' in payload.detail) {
    const { collection } = payload.detail;
    const _index = config.indexLangMap[collection.language.toLowerCase()];
    const stories = collection.stories.map((story) => ({
      meta: {
        _id: story.collection_story_id,
        _index,
      },
      url: story.url,
      messageId: payload.messageId,
    }));
    return stories;
  } else {
    const _index = config.indexLangMap[payload.detail.language.toLowerCase()];
    return [
      {
        meta: {
          _id: payload.detail.approvedItemExternalId,
          _index,
        },
        url: payload.detail.url,
        messageId: payload.messageId,
      },
    ];
  }
}
