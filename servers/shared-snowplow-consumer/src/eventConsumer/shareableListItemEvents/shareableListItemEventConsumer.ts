import { ShareableListItemEvent } from '@pocket-tools/event-bridge';
import { ShareableListItemEventHandler } from '../../snowplow/shareableListItem/shareableListItemEventHandler';

export function shareableListItemEventConsumer(event: ShareableListItemEvent) {
  new ShareableListItemEventHandler().process(event);
}
