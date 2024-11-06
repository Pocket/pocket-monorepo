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

export const validDetailTypes: Array<PocketEventType> = [
  PocketEventType.CORPUS_ITEM_ADDED,
  PocketEventType.CORPUS_ITEM_UPDATED,
  PocketEventType.CORPUS_ITEM_REMOVED,
  PocketEventType.COLLECTION_CREATED,
  PocketEventType.COLLECTION_UPDATED,
];

// See indices .docker/aws-resources/elasticsearch
export type CorpusItemIndex = {
  meta: { _id: string; _index: string };
  fields: Partial<{
    corpusId: string;
    title: string | null;
    url: string;
    excerpt: string | null;
    is_syndicated: boolean;
    language: string;
    publisher: string | null;
    topic: string | null;
    authors: string | string[];
    created_at: number; // seconds from epoch
    published_at: number | null; // seconds from epoch
    is_collection: boolean;
    collection_labels: string | string[] | null;
    curation_category: string | null;
    iab_parent: string | null;
    iab_child: string | null;
    is_collection_story?: boolean;
    parent_collection_id?: string;
    isTimeSensitive?: boolean | null;
  }>;
};

export type ValidLanguageApprovedItemPayload = Omit<
  CorpusItemPayload,
  'language'
> & {
  language: string;
};

// Corpus items which are not collections, to be indexed
export type CollectionApprovedItemPayload = Omit<
  ValidLanguageApprovedItemPayload,
  'isCollection'
> & {
  isCollection: true;
};

// Corpus items which are not collections, to be indexed
export type SyndicatedItemPayload = Omit<
  ValidLanguageApprovedItemPayload,
  'isSyndicated'
> & {
  isSyndicated: true;
  isCollection: false | undefined;
};
