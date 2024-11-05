import { BaseEvent } from './base';
import { PocketEventType } from '../events';

export type SharePocketEventType =
  | PocketEventType.SHARE_CREATED
  | PocketEventType.SHARE_CONTEXT_UPDATED;

export type ShareEvent = ShareCreated | ShareContextUpdated;

type Share = BaseEvent & {
  detail: {
    pocketShare: {
      target_url: string;
      created_at: number; // epoch time in seconds
      slug: string;
      note_length: number;
      quote_count: number;
    };
  };
};

export type ShareCreated = Share & {
  'detail-type': PocketEventType.SHARE_CREATED;
};

export type ShareContextUpdated = Share & {
  'detail-type': PocketEventType.SHARE_CONTEXT_UPDATED;
};
