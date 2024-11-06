// Note: These are reused (copied) from user-list-search-corpus-indexing/src/types
// since they listen to the same event

import {
  CorpusEvent,
  CorpusItemPayload,
  CollectionPayload,
  CollectionEvent,
  PocketEventType,
  IncomingBaseEvent,
} from '@pocket-tools/event-bridge';

type BaseEventPayload = (CollectionEvent | CorpusEvent) & IncomingBaseEvent;

export type EventPayload = {
  messageId: string;
  detail: BaseEventPayload['detail'];
  detailType: PocketEventType;
};
export type ValidatedEventPayload = Omit<EventPayload, 'detail'> & {
  detail: ValidLanguageApprovedItemPayload | CollectionPayload;
};

export type ValidLangEventPayload = Omit<EventPayload, 'detail'> & {
  detail: ValidLanguageApprovedItemPayload | CollectionPayload;
};

export type ValidLanguageApprovedItemPayload = Omit<
  CorpusItemPayload,
  'language'
> & {
  language: string;
};

export type IndexMeta = {
  meta: { _id: string; _index: string };
};

export interface BulkRequestMeta extends IndexMeta {
  url: string;
  messageId: string;
  title?: string | null;
  excerpt?: string | null;
  isCollection: boolean;
}

export interface BulkRequestPayload extends BulkRequestMeta {
  fields: ParserDocumentFields & { passage_embeddings?: number[] };
}

// See indices .docker/aws-resources/elasticsearch
export type ParserDocumentFields = Partial<{
  pocket_parser_extracted_text: string | null;
  est_time_to_consume_minutes: number;
  // Overall categorization for the content (e.g. article/index/video)
  content_type_parent: string;
  // Child types for the content
  // e.g. an article with embedded videos would have video as a child type
  content_type_children: string[];
  // Unindexed fields that can be returned in the response
  // for downstream data joins/deduplication
  pocket_item_id: string;
  pocket_resolved_id: string;
  pocket_normal_url: string;
  pocket_resolved_url: string;
  // The URL sent to the parser request (should be the same as
  // the URL field provided in the message
  pocket_parser_request_given_url: string;
}>;

export type ParserResult = {
  item_id: string;
  resolved_id: string;
  given_url: string;
  normal_url: string;
  resolved_normal_url: string;
  time_to_read: number;
  article: string | null;
  isArticle: number;
  has_video: string;
  has_image: string;
  isIndex: number;
  title: string | null;
  excerpt: string | null;
  videos?: { [id: number]: { length: string } };
};

// See infrastructure/pocket-event-bridge/src/event-rules/corpus-events/eventConfig.ts
// and infrastructure/pocket-event-bridge/src/event-rules/collection-events/eventConfig.ts
export const validDetailTypes: Array<PocketEventType> = [
  PocketEventType.CORPUS_ITEM_ADDED,
  PocketEventType.CORPUS_ITEM_UPDATED,
  PocketEventType.COLLECTION_CREATED,
  PocketEventType.COLLECTION_UPDATED,
];
