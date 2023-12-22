import {
  gotEmitter,
  HttpMethod,
  HttpProtocol,
  tracker as snowPlowTracker,
} from '@snowplow/node-tracker';
import { config } from '../config';

const emitter = gotEmitter(
  config.snowplow.endpoint,
  config.snowplow.httpProtocol as HttpProtocol,
  undefined,
  HttpMethod.POST,
  config.snowplow.bufferSize,
  config.snowplow.retries
);

export function getTracker(appId) {
  return snowPlowTracker(emitter, null, appId, true);
}
