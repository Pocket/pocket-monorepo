import {
  gotEmitter,
  HttpMethod,
  HttpProtocol,
  tracker as snowPlowTracker,
} from '@snowplow/node-tracker';
import config from '../config/index.js';

const emitter = gotEmitter(
  config.snowplow.endpoint,
  config.snowplow.httpProtocol as HttpProtocol,
  undefined,
  HttpMethod.POST,
  config.snowplow.bufferSize,
  config.snowplow.retries,
);

export const tracker = snowPlowTracker(
  emitter,
  null,
  config.snowplow.appId,
  true,
);
