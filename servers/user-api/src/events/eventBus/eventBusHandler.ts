import EventEmitter from 'events';
import * as Sentry from '@sentry/node';
import {
  EventBridgeClient,
  EventBridgeClientConfig,
  PutEventsCommand,
  PutEventsCommandOutput,
} from '@aws-sdk/client-eventbridge';
import config from '../../config';
import { eventMap } from './config';
import { EventHandlerInterface } from '../interfaces';
import { EventHandlerCallbackMap } from './types';
import { serverLogger } from '@pocket-tools/ts-logger';

/**
 * This class MUST be initialized using the EventBusHandler.init() method.
 * This is done to ensure event handlers adhere to the EventHandlerInterface.
 */
export class EventBusHandler implements EventHandlerInterface {
  private client: EventBridgeClient;

  init(emitter: EventEmitter, eventHandlerMap?: EventHandlerCallbackMap) {
    const awsConfig: EventBridgeClientConfig = {
      region: config.aws.region,
    };

    // Set endpoint for local client, otherwise provider default
    if (config.aws.endpoint != null) {
      awsConfig.endpoint = config.aws.endpoint;
      awsConfig.credentials = { accessKeyId: 'asd', secretAccessKey: 'asd' };
    }

    this.client = new EventBridgeClient(awsConfig);

    const handlerMap = eventHandlerMap ?? eventMap;

    Object.entries(handlerMap).forEach(([event, method]) => {
      emitter.on(event, async (data) => {
        let eventPayload = undefined;
        try {
          eventPayload = method(data);
          await this.sendEvent(eventPayload);
        } catch (error) {
          // In the unlikely event that the payload generator throws an error,
          // log to Sentry and Cloudwatch but don't halt program
          const failedEventError = new Error(
            `Failed to send event '${
              eventPayload.eventType
            }' to event bus. Event Body:\n ${JSON.stringify(eventPayload)}`,
          );
          // Don't halt program, but capture the failure in Sentry and Cloudwatch
          Sentry.addBreadcrumb(failedEventError);
          Sentry.captureException(error);
          serverLogger.error(failedEventError);
          serverLogger.error(error);
        }
      });
    });

    return this;
  }

  /**
   * Send event to Event Bus, pulling the event bus and the event source
   * from the config.
   * Will not throw errors if event fails; instead, log exception to Sentry
   * and add to Cloudwatch logs.
   * @param eventPayload the payload to send to event bus
   */
  async sendEvent(eventPayload: any) {
    const putEventCommand = new PutEventsCommand({
      Entries: [
        {
          EventBusName: config.aws.eventBus.name,
          Detail: JSON.stringify(eventPayload),
          Source: config.aws.eventBus.eventBridge.source,
          DetailType: eventPayload.eventType,
        },
      ],
    });
    const output: PutEventsCommandOutput =
      await this.client.send(putEventCommand);
    if (output.FailedEntryCount) {
      const failedEventError = new Error(
        `Failed to send event '${
          eventPayload.eventType
        }' to event bus. Event Body:\n ${JSON.stringify(eventPayload)}`,
      );
      // Don't halt program, but capture the failure in Sentry and Cloudwatch
      Sentry.captureException(failedEventError);
      serverLogger.error(failedEventError);
    }
  }
}
