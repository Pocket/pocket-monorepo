import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import { SearchResult, createSearchResult } from '../../snowtype/snowplow';
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
    const searchData = createSearchResult(data.detail.search);
    this.trackObjectUpdate<SearchResult>(this.tracker, {
      trigger: data['detail-type'],
      object: 'pocket_search_result',
      context: [searchData],
    });
  }
}
