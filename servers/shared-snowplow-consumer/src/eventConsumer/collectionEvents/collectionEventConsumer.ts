import { CollectionEventHandler } from '../../snowplow/collection/collectionEventHandler.js';
import { CollectionEventBridgePayload } from './types.js';

export function collectionEventConsumer(
  requestBody: CollectionEventBridgePayload,
) {
  new CollectionEventHandler().process(requestBody);
}
