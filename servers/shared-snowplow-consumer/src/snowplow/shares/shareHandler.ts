import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import { PocketShare, createPocketShare } from '../../snowtype/snowplow';
import { ShareEvent } from '@pocket-tools/event-bridge';

/**
 * class to send shares-api events to snowplow
 */
export class PocketShareEventHandler extends EventHandler {
  constructor() {
    const tracker = getTracker(config.snowplow.appIds.sharesApi);
    super(tracker);
    return this;
  }

  /**
   * method to create and process event data
   * @param data
   */
  process(data: ShareEvent): void {
    const shareData = createPocketShare(data.detail.pocketShare);
    this.trackObjectUpdate<PocketShare>(this.tracker, {
      trigger: data['detail-type'],
      object: 'pocket_share',
      context: [shareData],
    });
  }
}
