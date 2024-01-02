import { getCollectionEventPayload } from './collectionEventConsumer';
import { CollectionEventPayloadSnowplow } from '../../snowplow/collection/types';
import { testCollectionData } from '../../snowplow/collection/testData';

describe('getCollectionEventPayload', () => {
  it('should convert collection created event request body to Collection', () => {
    const collectionCreatedEvent: CollectionEventPayloadSnowplow = {
      object_version: 'new',
      collection: testCollectionData,
      eventType: 'COLLECTION_CREATED',
    };

    const requestBody = {
      'detail-type': 'collection-created',
      source: 'collection-created',
      detail: { collection: testCollectionData },
    };

    const payload = getCollectionEventPayload(requestBody);
    expect(payload).toEqual(collectionCreatedEvent);
  });

  it('should convert collection updated event request body to Collection', () => {
    const collectionUpdatedEvent: CollectionEventPayloadSnowplow = {
      object_version: 'new',
      collection: testCollectionData,
      eventType: 'COLLECTION_UPDATED',
    };

    const requestBody = {
      'detail-type': 'collection-updated',
      source: 'collection-updated',
      detail: { collection: testCollectionData },
    };

    const payload = getCollectionEventPayload(requestBody);
    expect(payload).toEqual(collectionUpdatedEvent);
  });
});
