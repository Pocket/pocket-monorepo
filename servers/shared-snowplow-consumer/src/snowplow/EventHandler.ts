import { PayloadBuilder, SelfDescribingJson } from '@snowplow/tracker-core';
import * as Sentry from '@sentry/node';
import { Tracker } from '@snowplow/node-tracker';

export class EventHandler {
  constructor(protected tracker: Tracker) {
    this.tracker = tracker;
  }

  /**
   * Queue snowplow event to be tracked
   * @param event
   * @param context
   * @private
   */
  protected addToTrackerQueue(
    event: PayloadBuilder,
    context: SelfDescribingJson[]
  ): void {
    try {
      // Note: the track method provided by the @snowplow/node-tracker package
      // only queues the event to be tracked. The package has internal logic
      // to decide when to flush the queue and actually send the events to the
      // snowplow endpoint.
      //
      // Snowplow has an open issue to make this library async:
      // https://github.com/snowplow/snowplow-javascript-tracker/issues/1087
      this.tracker.track(event, context);
      console.log(
        `queueing snowplow event to be tracked ->${JSON.stringify(
          event.getJson()
        )} with context -> ${JSON.stringify(context)}`
      );
    } catch (ex) {
      const message = `Failed to queue event to snowplow.\n event: ${event}\n context: ${context}`;
      console.log(message);
      Sentry.addBreadcrumb({ message });
      Sentry.captureException(ex);
    }
  }
}
