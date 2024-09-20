import { config } from './config';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.sentry.environment,
});
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import {
  validDetailTypes,
  BulkRequestMeta,
  BulkRequestPayload,
  ValidLangEventPayload,
} from './types';
import { parserRequest, parserResultToDoc } from './parserRequest';
import { bulkIndex } from './bulkIndex';
import { buildCollectionUrl, hasExcerptOrIsCollection } from './utils';
import { getEmbeddings } from './embeddingsRequest';

/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export async function processor(event: SQSEvent): Promise<SQSBatchResponse> {
  const failedMessageIds: string[] = [];

  const validPayloads: Array<ValidLangEventPayload> = event.Records.map(
    (record) => {
      const message = JSON.parse(JSON.parse(record.body).Message);
      return {
        messageId: record.messageId,
        detailType: message['detail-type'],
        detail: message['detail'],
      };
    },
  )
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
  const docsToIndex: BulkRequestPayload[] = [];
  for await (const request of parserRequests) {
    const parserResult = await parserRequest(request.url);
    if (parserResult == null) {
      failedMessageIds.push(request.messageId);
      continue;
    }
    const fields: BulkRequestPayload['fields'] =
      parserResultToDoc(parserResult);
    // Get embeddings
    if (
      config.embeddingsEnabled &&
      config.indexSupportsEmbeddings[request.meta._index] &&
      // Don't index embeddings for articles without excerpts that
      // aren't collections. This is a proxy indicator for quality
      // and review, as articles without excerpts tend to be poorly
      // parsed (e.g. have urls for titles)
      hasExcerptOrIsCollection(request)
    ) {
      const embeddingsRequest = {
        given_url: request.url,
        title: request.title?.length ? request.title : parserResult.title,
        excerpt: request.excerpt?.length
          ? request.excerpt
          : parserResult.excerpt,
      };
      const embeddings = await getEmbeddings(embeddingsRequest);
      if (embeddings != null) {
        fields['passage_embeddings'] = embeddings;
      }
    }
    docsToIndex.push({ ...request, fields });
  }
  // Deduplicate failed messages since collections have multiple requests by same ID
  const indexFailures = await bulkIndex(docsToIndex);
  failedMessageIds.push(...indexFailures);
  const batchItemFailures = [...new Set(failedMessageIds)].map((id) => ({
    itemIdentifier: id,
  }));
  return { batchItemFailures };
}

export const handler = Sentry.wrapHandler(processor);
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
export function unwrapPayloads(
  payload: ValidLangEventPayload,
): BulkRequestMeta[] {
  if ('collection' in payload.detail) {
    const { collection } = payload.detail;
    const _index = config.indexLangMap[collection.language.toLowerCase()];
    const stories = collection.stories.map((story) => ({
      meta: {
        _id: story.collection_story_id,
        _index,
      },
      url: story.url,
      title: story.title,
      excerpt: story.excerpt,
      messageId: payload.messageId,
      isCollection: false,
    }));
    const parent = {
      meta: {
        _id: collection.externalId,
        _index,
      },
      url: buildCollectionUrl(collection.slug, collection.language),
      title: collection.title,
      excerpt: collection.excerpt,
      messageId: payload.messageId,
      isCollection: true,
    };
    return [parent, ...stories];
  } else {
    const _index = config.indexLangMap[payload.detail.language.toLowerCase()];
    return [
      {
        meta: {
          _id: payload.detail.approvedItemExternalId,
          _index,
        },
        url: payload.detail.url,
        title: payload.detail.title,
        excerpt: payload.detail.excerpt,
        messageId: payload.messageId,
        isCollection: false,
      },
    ];
  }
}
