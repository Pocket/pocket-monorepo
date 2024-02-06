import { UserEventHandler } from '../../snowplow/user/userEventHandler';
import { UserEventBridgePaylod } from './types';

export function userEventConsumer(requestBody: UserEventBridgePaylod) {
  new UserEventHandler().process(requestBody);
}
