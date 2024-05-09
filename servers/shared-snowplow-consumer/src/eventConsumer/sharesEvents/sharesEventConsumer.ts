import { PocketShareEventHandler } from '../../snowplow/shares/shareHandler';

export type PocketSharePayload = {
  detail: { pocketShare: PocketShareEvent };
  source: 'shares-api-events';
  'detail-type': ShareEventDetailType;
};

export type ShareEventDetailType =
  | 'pocket_share_created'
  | 'pocket_share_context_updated';

export type PocketShareEvent = {
  target_url: string;
  created_at: number; // epoch time in seconds
  slug: string;
  note_length: number;
  quote_count: number;
};

// todo: why?
export function pocketShareEventConsumer(requestBody: PocketSharePayload) {
  new PocketShareEventHandler().process(requestBody);
}
