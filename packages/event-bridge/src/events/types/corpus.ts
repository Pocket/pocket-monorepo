// Types below are all copied from:

import { PocketEventType } from '../events.ts';
import { BaseEvent } from './base.ts';

export type CorpusPocketEventType =
  | PocketEventType.CORPUS_ITEM_ADDED
  | PocketEventType.CORPUS_ITEM_UPDATED
  | PocketEventType.CORPUS_ITEM_REMOVED;

export type CorpusEvent =
  | CorpusItemAdded
  | CorpusItemUpdated
  | CorpusItemRemoved;

interface BaseCorpusEvent extends BaseEvent {
  'detail-type': CorpusPocketEventType;
  detail: CorpusItemPayload;
}

export interface CorpusItemAdded extends BaseCorpusEvent {
  'detail-type': PocketEventType.CORPUS_ITEM_ADDED;
}

export interface CorpusItemUpdated extends BaseCorpusEvent {
  'detail-type': PocketEventType.CORPUS_ITEM_UPDATED;
}

export interface CorpusItemRemoved extends BaseCorpusEvent {
  'detail-type': PocketEventType.CORPUS_ITEM_REMOVED;
}

// https://github.com/Pocket/content-monorepo/blob/7342cb5468f11fc0b3ffdddf8693b6aeeb64f26e/servers/curated-corpus-api/src/events/types.ts#L95
interface Author {
  name: string;
  sortOrder: number;
}

// TODO: Validate with the content team that these fields really can be null.
//       Looking at the database schema, none of these fields are nullable.
export interface CorpusItemPayload {
  eventType: string;
  approvedItemExternalId: string;
  url: string;
  authors?: Author[];
  title?: string | null;
  excerpt?: string | null;
  language?: string | null;
  publisher?: string | null;
  imageUrl?: string | null;
  topic?: string | null;
  createdAt?: string | null; // UTC timestamp string
  createdBy?: string | null; // UTC timestamp string
  updatedAt?: string | null; // UTC timestamp string
  datePublished?: string; // UTC timestamp string
  isSyndicated?: boolean;
  isCollection?: boolean;
  domainName?: string;
  isTimeSensitive?: boolean;
  source?: string | null;
  grade?: string | null;
}
