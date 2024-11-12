import { ShareableListEvent } from '@pocket-tools/event-bridge';
import { ShareableListEventHandler } from '../../snowplow/shareableList/shareableListEventHandler';

export function shareableListEventConsumer(event: ShareableListEvent) {
  new ShareableListEventHandler().process(event);
}
