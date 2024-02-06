import { ObjectUpdateTrigger } from '../../snowtype/snowplow';

export enum EventType {
  SHAREABLE_LIST_CREATED = 'SHAREABLE_LIST_CREATED',
  SHAREABLE_LIST_UPDATED = 'SHAREABLE_LIST_UPDATED',
  SHAREABLE_LIST_DELETED = 'SHAREABLE_LIST_DELETED',
  SHAREABLE_LIST_PUBLISHED = 'SHAREABLE_LIST_PUBLISHED',
  SHAREABLE_LIST_UNPUBLISHED = 'SHAREABLE_LIST_UNPUBLISHED',
  SHAREABLE_LIST_HIDDEN = 'SHAREABLE_LIST_HIDDEN',
  SHAREABLE_LIST_UNHIDDEN = 'SHAREABLE_LIST_UNHIDDEN',
}

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

export type BasicShareableListEventPayloadWithContext = {
  object_version: string;
  shareable_list: ShareableList;
};

export type EventTypeString = keyof typeof EventType;

export type ShareableListEventPayloadSnowplow =
  BasicShareableListEventPayloadWithContext & {
    eventType: EventTypeString;
  };

export const SnowplowEventMap: Record<EventTypeString, ObjectUpdateTrigger> = {
  SHAREABLE_LIST_CREATED: 'shareable_list_created',
  SHAREABLE_LIST_UPDATED: 'shareable_list_updated',
  SHAREABLE_LIST_DELETED: 'shareable_list_deleted',
  SHAREABLE_LIST_PUBLISHED: 'shareable_list_published',
  SHAREABLE_LIST_UNPUBLISHED: 'shareable_list_unpublished',
  SHAREABLE_LIST_HIDDEN: 'shareable_list_hidden',
  SHAREABLE_LIST_UNHIDDEN: 'shareable_list_unhidden',
};

export enum Visibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

export enum ModerationStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
}
