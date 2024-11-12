import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  ObjectUpdate,
  ObjectUpdateTrigger,
  createAPIUser,
  createAccount,
  createUser,
} from '../../snowtype/snowplow';
import {
  AccountEvent as BaseAccountEvent,
  AccountPocketEventType,
  PocketEventType,
  AccountRegistration,
} from '@pocket-tools/event-bridge';

export type AccountEvent = Exclude<BaseAccountEvent, AccountRegistration>;

export const SnowplowEventMap: Record<
  Exclude<AccountPocketEventType, PocketEventType.ACCOUNT_REGISTRATION>,
  ObjectUpdateTrigger
> = {
  'account-deletion': 'account_delete',
  'account-email-updated': 'account_email_updated',
  'account-password-changed': 'account_password_changed',
};

/**
 * class to send `user-event` to snowplow
 */
export class UserEventHandler extends EventHandler {
  constructor() {
    const tracker = getTracker(config.snowplow.appIds.userApi);
    super(tracker);
    return this;
  }

  /**
   * method to create and process event data
   * @param data
   */
  process(event: AccountEvent): void {
    this.addRequestInfoToTracker(event.detail);
    const context = UserEventHandler.generateEventContext(event);
    this.trackObjectUpdate(this.tracker, {
      ...UserEventHandler.generateAccountUpdateEvent(event),
      context,
    });
  }

  /**
   * @private
   */
  private static generateAccountUpdateEvent(event: AccountEvent): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[event['detail-type']],
      object: 'account',
    };
  }

  /**
   * @private to build event context for ACCOUNT_DELETE event.
   */
  private static generateDeleteEventAccountContext(
    event: AccountEvent['detail'],
  ): SelfDescribingJson {
    return createAccount({
      object_version: 'new',
      user_id: parseInt(event.userId),
    }) as unknown as SelfDescribingJson;
  }

  private static generateAccountContext(
    event: AccountEvent['detail'],
  ): SelfDescribingJson {
    return createAccount({
      object_version: 'new',
      user_id: parseInt(event.userId),
      emails: [event.email],
    }) as unknown as SelfDescribingJson;
  }

  private static generateEventContext(
    event: AccountEvent,
  ): SelfDescribingJson[] {
    const context = [
      UserEventHandler.generateUserContext(event.detail),
      UserEventHandler.generateApiUserContext(event.detail),
    ];

    if (event['detail-type'] === PocketEventType.ACCOUNT_DELETION) {
      context.push(
        UserEventHandler.generateDeleteEventAccountContext(event.detail),
      );
    } else {
      context.push(UserEventHandler.generateAccountContext(event.detail));
    }

    return context;
  }

  private static generateUserContext(
    event: AccountEvent['detail'],
  ): SelfDescribingJson {
    return createUser({
      email: event.email,
      hashed_guid: event.hashedGuid,
      user_id: parseInt(event.userId),
      hashed_user_id: event.hashedId,
      guid: event.guid ?? undefined,
    }) as unknown as SelfDescribingJson;
  }

  private static generateApiUserContext(
    event: AccountEvent['detail'],
  ): SelfDescribingJson {
    return createAPIUser({
      api_id: parseInt(event.apiId),
      name: event.name,
      is_native: event.isNative,
      is_trusted: event.isTrusted,
      client_version: event.clientVersion,
    }) as unknown as SelfDescribingJson;
  }

  /**
   * Updates tracker with request information
   * @private
   */
  private addRequestInfoToTracker(event: AccountEvent['detail']) {
    this.tracker.setLang(event.language);
    this.tracker.setDomainUserId(event.snowplowDomainUserId); // possibly grab from cookie else grab from context
    this.tracker.setIpAddress(event.ipAddress); // get the remote address from teh x-forwarded-for header
    this.tracker.setUseragent(event.userAgent);
  }
}
