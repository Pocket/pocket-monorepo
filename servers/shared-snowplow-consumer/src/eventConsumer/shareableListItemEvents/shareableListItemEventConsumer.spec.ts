import { getShareableListItemEventPayload } from './shareableListItemEventConsumer';
import {
  EventType,
  ShareableListItemEventPayloadSnowplow,
} from '../../snowplow/shareableListItem/types';
import {
  testShareableListItemData,
  testPartialShareableListItemData,
} from '../../snowplow/shareableListItem/testData';

describe('getShareableListItemEventPayload', () => {
  it('should convert shareable_list_item_created event request body to Snowplow ShareableListItem', () => {
    const shareableListItemCreatedEvent: ShareableListItemEventPayloadSnowplow =
      {
        shareable_list_item: testShareableListItemData,
        eventType: EventType.SHAREABLE_LIST_ITEM_CREATED,
      };

    const requestBody = {
      'detail-type': 'shareable_list_item_created',
      source: 'shareable-list-item-events',
      detail: { shareableListItem: testShareableListItemData },
    };

    const payload = getShareableListItemEventPayload(requestBody);
    expect(payload).toEqual(shareableListItemCreatedEvent);
  });

  it('should convert shareable_list_item_updated event request body to Snowplow ShareableListItem', () => {
    const shareableListItemCreatedEvent: ShareableListItemEventPayloadSnowplow =
      {
        shareable_list_item: testShareableListItemData,
        eventType: EventType.SHAREABLE_LIST_ITEM_UPDATED,
      };

    const requestBody = {
      'detail-type': 'shareable_list_item_updated',
      source: 'shareable-list-item-events',
      detail: { shareableListItem: testShareableListItemData },
    };

    const payload = getShareableListItemEventPayload(requestBody);
    expect(payload).toEqual(shareableListItemCreatedEvent);
  });

  it('should convert shareable_list_item_deleted event request body to Snowplow ShareableListItem', () => {
    const shareableListItemDeletedEvent: ShareableListItemEventPayloadSnowplow =
      {
        shareable_list_item: testShareableListItemData,
        eventType: EventType.SHAREABLE_LIST_ITEM_DELETED,
      };

    const requestBody = {
      'detail-type': 'shareable_list_item_deleted',
      source: 'shareable-list-item-events',
      detail: { shareableListItem: testShareableListItemData },
    };

    const payload = getShareableListItemEventPayload(requestBody);
    expect(payload).toEqual(shareableListItemDeletedEvent);
  });

  it('should convert shareable_list_item_deleted event with missing non-required fields request body to Snowplow ShareableListItem', () => {
    const shareableListItemDeletedEvent: ShareableListItemEventPayloadSnowplow =
      {
        shareable_list_item: testPartialShareableListItemData,
        eventType: EventType.SHAREABLE_LIST_ITEM_DELETED,
      };

    const requestBody = {
      'detail-type': 'shareable_list_item_deleted',
      source: 'shareable-list-item-events',
      detail: { shareableListItem: testPartialShareableListItemData },
    };

    const payload = getShareableListItemEventPayload(requestBody);
    expect(payload).toEqual(shareableListItemDeletedEvent);
  });
});
