import {
  EventTypeString,
  Collection,
  CollectionEventPayloadSnowplow,
} from '../../snowplow/collection/types';
import { CollectionEventHandler } from '../../snowplow/collection/collectionEventHandler';

// Collection events detail-type in event rule defined in the pocket-event-bridge repo
// see here .aws/src/event-rules/collection-events/eventConfig.ts
export const DetailTypeToSnowplowMap: Record<string, EventTypeString> = {
  'collection-created': 'COLLECTION_CREATED',
  'collection-updated': 'COLLECTION_UPDATED',
};

//event bridge payload for Collection
export type CollectionEventBusPayload = Collection;

export function collectionEventConsumer(requestBody: any) {
  new CollectionEventHandler().process(getCollectionEventPayload(requestBody));
}

/**
 * converts the event-bridge event format to snowplow payload
 * for a Collection event
 * @param eventObj event bridge event format
 */
export function getCollectionEventPayload(
  eventObj: any,
): CollectionEventPayloadSnowplow {
  const eventPayload: CollectionEventBusPayload = eventObj['detail'];
  const detailType = eventObj['detail-type'];
  return {
    //todo @herraj: refactor as part of chores ticket
    //and validate events from event-bridge
    collection: eventPayload['collection'],
    object_version: 'new',
    eventType: DetailTypeToSnowplowMap[detailType],
  };
}
