export type ShareableListEventBridgePayload = {
  detail: { shareableList: ShareableList };
  'detail-type': EventType;
  source: 'shareable-list-events' | string;
};

export type EventType =
  | 'shareable_list_created'
  | 'shareable_list_updated'
  | 'shareable_list_deleted'
  | 'shareable_list_published'
  | 'shareable_list_unpublished'
  | 'shareable_list_hidden'
  | 'shareable_list_unhidden';

export type ShareableList = {
  shareable_list_external_id: string;
  user_id: number;
  slug?: string;
  title: string;
  description?: string;
  status: Visibility;
  list_item_note_visibility: Visibility;
  moderation_status: ModerationStatus;
  moderated_by?: string;
  moderation_reason?: string;
  moderation_details?: string;
  restoration_reason?: string;
  created_at: number; // snowplow schema requires this field in seconds
  updated_at?: number; // snowplow schema requires this field in seconds
};

export enum Visibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

export enum ModerationStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
}
