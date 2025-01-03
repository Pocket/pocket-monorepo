import { BaseEvent } from './base.ts';
import { PocketEventType } from '../events.ts';

export type SharePocketEventType =
  | PocketEventType.SHARE_CREATED
  | PocketEventType.SHARE_CONTEXT_UPDATED;

export type ShareEvent = ShareCreated | ShareContextUpdated;

interface Share extends BaseEvent {
  detail: {
    pocketShare: {
      target_url: string;
      created_at: number; // epoch time in seconds
      slug: string;
      note_length: number;
      quote_count: number;
    };
  };
}

export interface ShareCreated extends Share {
  'detail-type': PocketEventType.SHARE_CREATED;
}

export interface ShareContextUpdated extends Share {
  'detail-type': PocketEventType.SHARE_CONTEXT_UPDATED;
}
