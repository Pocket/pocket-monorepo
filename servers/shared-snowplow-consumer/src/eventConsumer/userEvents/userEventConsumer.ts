import { UserEventHandler } from '../../snowplow/user/userEventHandler.js';
import { UserEventBridgePaylod } from './types.js';

export function userEventConsumer(requestBody: UserEventBridgePaylod) {
  new UserEventHandler().process(requestBody);
}
