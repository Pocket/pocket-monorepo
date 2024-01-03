import { SelfDescribingJson } from '@snowplow/tracker-core';

export const shareableListItemEventSchema = {
  objectUpdate: 'iglu:com.pocket/object_update/jsonschema/1-0-15',
  shareable_list_item: 'iglu:com.pocket/shareable_list_item/jsonschema/1-0-5',
};

export type ShareableListItemEventPayloadSnowplow = {
  shareable_list_item: ShareableListItem['data'];
  eventType: EventType;
};

export type ObjectUpdate = {
  schema: string;
  data: {
    trigger: EventType;
    object: 'shareable_list_item';
  };
};

export enum EventType {
  SHAREABLE_LIST_ITEM_CREATED = 'shareable_list_item_created',
  SHAREABLE_LIST_ITEM_UPDATED = 'shareable_list_item_updated',
  SHAREABLE_LIST_ITEM_DELETED = 'shareable_list_item_deleted',
}

export type ShareableListItem = Omit<SelfDescribingJson, 'data'> & {
  data: {
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
};
