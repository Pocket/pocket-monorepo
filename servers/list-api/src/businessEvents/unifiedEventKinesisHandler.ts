import kinesis from '../aws/kinesis';
import config from '../config';
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import * as Sentry from '@sentry/node';
import {
  EventType,
  EventTypeString,
  ItemEventPayload,
  UnifiedEventMap,
  UnifiedEventPayload,
} from './types';
import { serverLogger } from '@pocket-tools/ts-logger';
import { ItemsEventEmitter } from './itemsEventEmitter';

export class UnifiedEventKinesisHandler {
  private readonly kinesis: KinesisClient;
  constructor(
    emitter: ItemsEventEmitter,
    events: Array<keyof typeof EventType>,
  ) {
    this.kinesis = kinesis;
    // register handler for item events
    events.forEach((event) =>
      emitter.on(
        EventType[event],
        async (data: ItemEventPayload) => await this.process(data),
      ),
    );
  }

  /**
   * Process event array and send to kinesis stream.
   * If the response still contains failed records after retrying,
   * log an error to console and sentry.
   * @param eventPayload the payload to send to event bus
   */
  public async process(data: ItemEventPayload) {
    const unifiedEvent = await unifiedEventTransformer(data);

    const putCommand = new PutRecordCommand({
      StreamName: config.aws.kinesis.unifiedEvents.streamName,
      Data: Buffer.from(JSON.stringify(unifiedEvent)),
      PartitionKey: `0-partition`,
    });

    try {
      await this.kinesis.send(putCommand);
    } catch (error) {
      serverLogger.error('Failed to send event(s) to kinesis stream', {
        stream: config.aws.kinesis.unifiedEvents.streamName,
        event: JSON.stringify(unifiedEvent),
        error,
      });
      Sentry.addBreadcrumb({
        message: `Failed Events: \n ${JSON.stringify(unifiedEvent)}`,
        data: { error: error },
      });
      Sentry.captureException(
        new Error(
          `Failed to send events to kinesis ${config.aws.kinesis.unifiedEvents.streamName}`,
        ),
      );
    }
  }
}

/**
 * Transform an ItemEventPayload into the format expected for UnifiedEvents.
 * Helper function for `unifiedEventKinesisHandler`.
 * Reference: https://github.com/pocket/spec/tree/master/backend/data/unified-event
 */
export async function unifiedEventTransformer(
  eventPayload: ItemEventPayload,
): Promise<UnifiedEventPayload> {
  return {
    type: UnifiedEventMap[eventPayload.eventType],
    data: await buildUnifiedEventData(eventPayload),
    timestamp: eventPayload.timestamp,
    source: eventPayload.source,
    version: eventPayload.version,
  };
}

/**
 * Explicitly check if the type of tag event is supported by the unified event handler
 * @param eventType
 */
function isSupportedTagEventType(eventType: EventTypeString) {
  return [
    EventType.ADD_TAGS,
    EventType.CLEAR_TAGS,
    EventType.REMOVE_TAGS,
    EventType.REPLACE_TAGS,
  ].includes(EventType[eventType]);
}

/**
 * Builds the unified event stream data
 * @param eventPayload
 */
async function buildUnifiedEventData(eventPayload: ItemEventPayload) {
  const data = {
    user_id: parseInt(eventPayload.user.id),
    item_id: parseInt((await eventPayload.savedItem).id),
    api_id: parseInt(eventPayload.apiUser.apiId),
  };

  if (isSupportedTagEventType(eventPayload.eventType)) {
    return {
      ...data,
      tags: eventPayload.tagsUpdated,
    };
  }

  return data;
}
