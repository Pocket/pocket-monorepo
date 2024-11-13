import { SearchEvent } from '@pocket-tools/event-bridge';
import { PocketSearchEventHandler } from '../../snowplow/search/searchHandler';

// todo: why?
export function pocketSearchEventConsumer(event: SearchEvent) {
  new PocketSearchEventHandler().process(event);
}
