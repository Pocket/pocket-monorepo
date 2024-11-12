import { ShareEvent } from '@pocket-tools/event-bridge';
import { PocketShareEventHandler } from '../../snowplow/shares/shareHandler';

// todo: why?
export function pocketShareEventConsumer(event: ShareEvent) {
  new PocketShareEventHandler().process(event);
}
