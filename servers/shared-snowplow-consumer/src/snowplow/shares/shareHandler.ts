import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  ObjectUpdate,
  PocketShare,
  createPocketShare,
} from '../../snowtype/snowplow';
import { PocketSharePayload } from '../../eventConsumer/sharesEvents/sharesEventConsumer';

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
  process(data: PocketSharePayload): void {
    const shareData = createPocketShare(data.detail.pocketShare);
    const objectUpdate: ObjectUpdate = {
      trigger: data['detail-type'],
      object: 'pocket_share',
    };
    this.trackObjectUpdate<PocketShare>(this.tracker, {
      objectUpdate,
      // TODO: why is this array
      context: [shareData],
    });
  }
}
