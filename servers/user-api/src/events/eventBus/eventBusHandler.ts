import EventEmitter from 'events';
import * as Sentry from '@sentry/node';
import config from '../../config';
import { eventMap } from './config';
import { EventHandlerInterface } from '../interfaces';
import { EventHandlerCallbackMap } from './types';
import { serverLogger } from '@pocket-tools/ts-logger';
import {
  PocketEvent,
  PocketEventBridgeClient,
  PocketEventBridgeConfig,
} from '@pocket-tools/event-bridge';

/**
 * This class MUST be initialized using the EventBusHandler.init() method.
 * This is done to ensure event handlers adhere to the EventHandlerInterface.
 */
export class EventBusHandler implements EventHandlerInterface {
  private client: PocketEventBridgeClient;

  init(emitter: EventEmitter, eventHandlerMap?: EventHandlerCallbackMap) {
    const eventBridgeConfig: PocketEventBridgeConfig = {
      aws: { region: config.aws.region },
      eventBus: { name: config.aws.eventBus.name },
    };

    // Set endpoint for local client, otherwise provider default
    if (config.aws.endpoint != null) {
      eventBridgeConfig.aws.endpoint = config.aws.endpoint;
      eventBridgeConfig.aws.credentials = {
        accessKeyId: 'asd',
        secretAccessKey: 'asd',
      };
    }

    this.client = new PocketEventBridgeClient(eventBridgeConfig);

    const handlerMap = eventHandlerMap ?? eventMap;

    Object.entries(handlerMap).forEach(([event, method]) => {
      emitter.on(event, async (data) => {
        let eventPayload: PocketEvent = undefined;
        try {
          eventPayload = method(data);
          await this.client.sendPocketEvent(eventPayload);
        } catch (error) {
          // In the unlikely event that the payload generator throws an error,
          // log to Sentry and Cloudwatch but don't halt program
          const failedEventError = new Error(
            `Failed to generate event '${
              eventPayload['detail-type']
            }'Event Body:\n ${JSON.stringify(eventPayload)}`,
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
}
