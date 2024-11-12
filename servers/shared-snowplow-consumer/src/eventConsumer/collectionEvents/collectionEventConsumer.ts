import { CollectionEvent } from '@pocket-tools/event-bridge';
import { CollectionEventHandler } from '../../snowplow/collection/collectionEventHandler';

export function collectionEventConsumer(event: CollectionEvent) {
  new CollectionEventHandler().process(event);
}
