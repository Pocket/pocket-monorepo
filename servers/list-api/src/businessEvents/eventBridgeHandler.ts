import { ItemsEventEmitter } from './itemsEventEmitter';
import { EventType, ItemEventPayload } from './types';
import config from '../config';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import { EventBridgeBase } from '../aws/eventBridgeBase';

export class EventBridgeHandler extends EventBridgeBase {
  constructor(
    emitter: ItemsEventEmitter,
    events: Array<keyof typeof EventType>,
  ) {
    super(eventBridgeClient);
    // register handler for item events
    events.forEach((event) =>
      emitter.on(
        EventType[event],
        async (data: ItemEventPayload) => await this.process(data),
      ),
    );
  }
  /**
   * Send event to Event Bus, pulling the event bus and the event source
   * from the config.
   * Will not throw errors if event fails; instead, log exception to Sentry
   * and add to Cloudwatch logs.
   * @param eventPayload the payload to send to event bus
   */
  public async process(data: ItemEventPayload) {
    const putEventCommand = new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.aws.eventBus.name,
          Detail: JSON.stringify(data),
          Source: config.serviceName,
          DetailType: data.eventType,
        },
      ],
    });
    await this.putEvents(putEventCommand);
  }
}
