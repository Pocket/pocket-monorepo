import {
  ShareableList,
  ShareableListModerationVisibility,
  ShareableListVisibility,
} from '@pocket-tools/event-bridge';

export const testShareableListData: ShareableList = {
  shareable_list_external_id: 'test-shareable-list-external-id',
  user_id: 12345,
  slug: 'test-shareable-list-slug',
  title: 'Test Shareable List Title',
  description: 'Test shareable list description',
  status: ShareableListVisibility.PUBLIC,
  list_item_note_visibility: ShareableListVisibility.PUBLIC,
  moderation_status: ShareableListModerationVisibility.VISIBLE,
  moderated_by: 'fake-moderator-username',
  moderation_reason: 'SPAM',
  moderation_details: 'more details here',
  restoration_reason: 'restoration details here',
  created_at: 1675978338, // 2023-02-09 16:32:18
  updated_at: 1675978338,
};

// data with missing non-required fields
export const testPartialShareableListData: ShareableList = {
  shareable_list_external_id: 'test-shareable-list-external-id',
  user_id: 12345,
  title: 'Test Shareable List Title',
  status: ShareableListVisibility.PUBLIC,
  list_item_note_visibility: ShareableListVisibility.PUBLIC,
  moderation_status: ShareableListModerationVisibility.VISIBLE,
  created_at: 1675978338, // 2023-02-09 16:32:18
};
