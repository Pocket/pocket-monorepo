export const eventConfig = {
  shareableList: {
    name: 'ShareableListEvents',
    source: 'shareable-list-events',
    detailType: [
      'shareable_list_created',
      'shareable_list_updated',
      'shareable_list_deleted',
      'shareable_list_hidden',
      'shareable_list_unhidden',
      'shareable_list_published',
      'shareable_list_unpublished',
    ],
  },
  shareableListItem: {
    name: 'ShareableListItemEvents',
    source: 'shareable-list-item-events',
    detailType: [
      'shareable_list_item_created',
      'shareable_list_item_updated',
      'shareable_list_item_deleted',
    ],
  },
};
