import * as Sentry from '@sentry/node';
import { Tracker } from '@snowplow/node-tracker';
import {
  CommonEventProperties,
  ObjectUpdate,
  trackObjectUpdate as baseTrackObjectUpdate,
} from '../snowtype/snowplow.js';
import { serverLogger } from '@pocket-tools/ts-logger';

export class EventHandler {
  constructor(protected tracker: Tracker) {
    this.tracker = tracker;
  }

  public trackObjectUpdate<T = any>(
    tracker: Tracker,
    objectUpdate: ObjectUpdate & CommonEventProperties<T>,
  ) {
    try {
      // Note: the track method provided by the @snowplow/node-tracker package
      // only queues the event to be tracked. The package has internal logic
      // to decide when to flush the queue and actually send the events to the
      // snowplow endpoint.
      //
      // Snowplow has an open issue to make this library async:
      // https://github.com/snowplow/snowplow-javascript-tracker/issues/1087
      baseTrackObjectUpdate(tracker, objectUpdate);
      serverLogger.info(
        `queueing snowplow event to be tracked ->${JSON.stringify(
          objectUpdate,
        )}`,
      );
    } catch (ex) {
      const message = `Failed to queue event to snowplow.\n event: ${JSON.stringify(
        objectUpdate,
      )}\n`;
      serverLogger.error(message);
      Sentry.addBreadcrumb({ message });
      Sentry.captureException(ex);
    }
  }
}
