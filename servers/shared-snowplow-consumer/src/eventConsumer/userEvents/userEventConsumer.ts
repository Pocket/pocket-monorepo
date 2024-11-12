import { AccountEvent, AccountRegistration } from '@pocket-tools/event-bridge';
import { UserEventHandler } from '../../snowplow/user/userEventHandler';

export function userEventConsumer(
  event: Exclude<AccountEvent, AccountRegistration>,
) {
  new UserEventHandler().process(event);
}
