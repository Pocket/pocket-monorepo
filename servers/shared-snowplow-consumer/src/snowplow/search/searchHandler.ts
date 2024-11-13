import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  createAPIUser,
  createUser,
  trackSearchResultSpec,
} from '../../snowtype/snowplow';
import { SearchEvent } from '@pocket-tools/event-bridge';

/**
 * class to send search-api events to snowplow
 */
export class PocketSearchEventHandler extends EventHandler {
  constructor() {
    const tracker = getTracker(config.snowplow.appIds.searchApi);
    super(tracker);
    return this;
  }

  /**
   * method to create and process event data
   * @param data
   */
  process(event: SearchEvent): void {
    const context = [
      createAPIUser(event.detail.event.apiUser),
      createUser(event.detail.event.user),
    ];
    const searchPayload = { ...event.detail.event.search, context };
    trackSearchResultSpec(this.tracker, searchPayload);
  }
}
