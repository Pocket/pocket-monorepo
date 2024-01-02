import { getShareableListEventPayload } from './shareableListEventConsumer';
import {
  EventType,
  ShareableListEventPayloadSnowplow,
} from '../../snowplow/shareableList/types';
import {
  testShareableListData,
  testPartialShareableListData,
} from '../../snowplow/shareableList/testData';

describe('getShareableListEventPayload', () => {
  it('should convert shareable_list_created event request body to Snowplow ShareableList', () => {
    const shareableListCreatedEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testShareableListData,
      eventType: EventType.SHAREABLE_LIST_CREATED,
    };

    const requestBody = {
      'detail-type': 'shareable_list_created',
      source: 'shareable-list-events',
      detail: { shareableList: testShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListCreatedEvent);
  });

  it('should convert shareable_list_updated event request body to Snowplow ShareableList', () => {
    const shareableListUpdatedEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testShareableListData,
      eventType: EventType.SHAREABLE_LIST_UPDATED,
    };

    const requestBody = {
      'detail-type': 'shareable_list_updated',
      source: 'shareable-list-events',
      detail: { shareableList: testShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListUpdatedEvent);
  });

  it('should convert shareable_list_deleted event request body to Snowplow ShareableList', () => {
    const shareableListDeletedEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testShareableListData,
      eventType: EventType.SHAREABLE_LIST_DELETED,
    };

    const requestBody = {
      'detail-type': 'shareable_list_deleted',
      source: 'shareable-list-events',
      detail: { shareableList: testShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListDeletedEvent);
  });

  it('should convert shareable_list_published event request body to Snowplow ShareableList', () => {
    const shareableListPublishedEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testShareableListData,
      eventType: EventType.SHAREABLE_LIST_PUBLISHED,
    };

    const requestBody = {
      'detail-type': 'shareable_list_published',
      source: 'shareable-list-events',
      detail: { shareableList: testShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListPublishedEvent);
  });

  it('should convert shareable_list_unpublished event request body to Snowplow ShareableList', () => {
    const shareableListUnpublishedEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testShareableListData,
      eventType: EventType.SHAREABLE_LIST_UNPUBLISHED,
    };

    const requestBody = {
      'detail-type': 'shareable_list_unpublished',
      source: 'shareable-list-events',
      detail: { shareableList: testShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListUnpublishedEvent);
  });

  it('should convert shareable_list_hidden event request body to Snowplow ShareableList', () => {
    const shareableListHiddenEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testShareableListData,
      eventType: EventType.SHAREABLE_LIST_HIDDEN,
    };

    const requestBody = {
      'detail-type': 'shareable_list_hidden',
      source: 'shareable-list-events',
      detail: { shareableList: testShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListHiddenEvent);
  });

  it('should convert shareable_list_unhidden event request body to Snowplow ShareableList', () => {
    const shareableListHiddenEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testShareableListData,
      eventType: EventType.SHAREABLE_LIST_UNHIDDEN,
    };

    const requestBody = {
      'detail-type': 'shareable_list_unhidden',
      source: 'shareable-list-events',
      detail: { shareableList: testShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListHiddenEvent);
  });

  it('should convert shareable_list_hidden event with missing non-required fields request body to Snowplow ShareableList', () => {
    const shareableListHiddenEvent: ShareableListEventPayloadSnowplow = {
      shareable_list: testPartialShareableListData,
      eventType: EventType.SHAREABLE_LIST_HIDDEN,
    };

    const requestBody = {
      'detail-type': 'shareable_list_hidden',
      source: 'shareable-list-events',
      detail: { shareableList: testPartialShareableListData },
    };

    const payload = getShareableListEventPayload(requestBody);
    expect(payload).toEqual(shareableListHiddenEvent);
  });
});
