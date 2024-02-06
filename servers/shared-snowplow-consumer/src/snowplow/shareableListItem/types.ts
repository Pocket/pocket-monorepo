import { ObjectUpdateTrigger } from '../../snowtype/snowplow';

export type EventTypeString = keyof typeof EventType;

export enum EventType {
  SHAREABLE_LIST_ITEM_CREATED = 'SHAREABLE_LIST_ITEM_CREATED',
  SHAREABLE_LIST_ITEM_UPDATED = 'SHAREABLE_LIST_ITEM_UPDATED',
  SHAREABLE_LIST_ITEM_DELETED = 'SHAREABLE_LIST_ITEM_DELETED',
}

export const SnowplowEventMap: Record<EventTypeString, ObjectUpdateTrigger> = {
  SHAREABLE_LIST_ITEM_CREATED: 'shareable_list_item_created',
  SHAREABLE_LIST_ITEM_UPDATED: 'shareable_list_item_updated',
  SHAREABLE_LIST_ITEM_DELETED: 'shareable_list_item_deleted',
};

export type BasicShareableListItemEventPayloadWithContext = {
  object_version: string;
  shareable_list_item: ShareableListItem;
};

export type ShareableListItemEventPayloadSnowplow =
  BasicShareableListItemEventPayloadWithContext & {
    eventType: EventTypeString;
  };

export type ShareableListItem = {
  shareable_list_item_external_id: string;
  shareable_list_external_id: string;
  given_url: string;
  title?: string;
  excerpt?: string;
  image_url?: string;
  authors?: string[];
  publisher?: string;
  note?: string;
  sort_order: number;
  created_at: number; // snowplow schema requires this field in seconds
  updated_at?: number; // snowplow schema requires this field in seconds
};
