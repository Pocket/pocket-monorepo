export type ShareableListItemEventBridgePayload = {
  detail: { shareableListItem: ShareableListItem };
  source: 'shareable-list-item-events' | string;
  'detail-type': EventType;
};

export type EventType =
  | 'shareable_list_item_created'
  | 'shareable_list_item_updated'
  | 'shareable_list_item_deleted';

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
