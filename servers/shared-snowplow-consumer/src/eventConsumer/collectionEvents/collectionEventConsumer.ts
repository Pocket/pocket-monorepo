import { CollectionEventHandler } from '../../snowplow/collection/collectionEventHandler';
import { CollectionEventBridgePayload } from './types';

export function collectionEventConsumer(
  requestBody: CollectionEventBridgePayload,
) {
  new CollectionEventHandler().process(requestBody);
}
