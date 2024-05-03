import { ShareableListItem } from '../../eventConsumer/shareableListItemEvents/types.js';

export const testShareableListItemData: ShareableListItem = {
  shareable_list_item_external_id: 'test-shareable-list-item-external-id',
  shareable_list_external_id: 'test-shareable-list-external-id',
  given_url: 'https://test-shareable-list-item-given-url.com',
  title: 'Test Shareable List Item Title',
  excerpt: 'Test shareable list item excerpt',
  image_url: 'https://test-shareable-list-item-image-url.com',
  authors: ['Author1', 'Author2'],
  publisher: 'Fake Publisher',
  note: 'some note',
  sort_order: 1,
  created_at: 1675978338, // 2023-02-09 16:32:18
  updated_at: 1675978338,
};

// data with missing non-required fields
export const testPartialShareableListItemData: ShareableListItem = {
  shareable_list_item_external_id: 'test-shareable-list-item-external-id',
  shareable_list_external_id: 'test-shareable-list-external-id',
  given_url: 'https://test-shareable-list-item-given-url.com',
  sort_order: 1,
  created_at: 1675978338, // 2023-02-09 16:32:18
};
