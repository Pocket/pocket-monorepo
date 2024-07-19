import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  createAPIUser,
  createUser,
  trackSearchResultSpec,
} from '../../snowtype/snowplow';
import { PocketSearchPayload } from '../../eventConsumer/searchEvents/searchEventconsumer';

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
  process(data: PocketSearchPayload): void {
    const context = [
      createAPIUser(data.detail.event.apiUser),
      createUser(data.detail.event.user),
    ];
    const searchPayload = { ...data.detail.event.search, context };
    trackSearchResultSpec(this.tracker, searchPayload);
  }
}
