import { SelfDescribingJson } from '@snowplow/tracker-core';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';
import {
  EventType,
  UserEventBridgePaylod,
} from '../../eventConsumer/userEvents/types';
import {
  ObjectUpdate,
  ObjectUpdateTrigger,
  createAPIUser,
  createAccount,
  createUser,
} from '../../snowtype/snowplow';

export const SnowplowEventMap: Record<EventType, ObjectUpdateTrigger> = {
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
  process(data: UserEventBridgePaylod): void {
    this.addRequestInfoToTracker(data.detail);
    const context = UserEventHandler.generateEventContext(data);
    this.trackObjectUpdate(this.tracker, {
      ...UserEventHandler.generateAccountUpdateEvent(data),
      context,
    });
  }

  /**
   * @private
   */
  private static generateAccountUpdateEvent(
    data: UserEventBridgePaylod,
  ): ObjectUpdate {
    return {
      trigger: SnowplowEventMap[data['detail-type']],
      object: 'account',
    };
  }

  /**
   * @private to build event context for ACCOUNT_DELETE event.
   */
  private static generateDeleteEventAccountContext(
    data: UserEventBridgePaylod['detail'],
  ): SelfDescribingJson {
    return createAccount({
      object_version: 'new',
      user_id: parseInt(data.userId),
    }) as unknown as SelfDescribingJson;
  }

  private static generateAccountContext(
    data: UserEventBridgePaylod['detail'],
  ): SelfDescribingJson {
    return createAccount({
      object_version: 'new',
      user_id: parseInt(data.userId),
      emails: [data.email],
    }) as unknown as SelfDescribingJson;
  }

  private static generateEventContext(
    data: UserEventBridgePaylod,
  ): SelfDescribingJson[] {
    const context = [
      UserEventHandler.generateUserContext(data.detail),
      UserEventHandler.generateApiUserContext(data.detail),
    ];

    if (data['detail-type'] == 'account-deletion') {
      context.push(
        UserEventHandler.generateDeleteEventAccountContext(data.detail),
      );
    } else {
      context.push(UserEventHandler.generateAccountContext(data.detail));
    }

    return context;
  }

  private static generateUserContext(
    data: UserEventBridgePaylod['detail'],
  ): SelfDescribingJson {
    return createUser({
      email: data.email,
      hashed_guid: data.hashedGuid,
      user_id: parseInt(data.userId),
      hashed_user_id: data.hashedId,
      guid: data.guid ?? undefined,
    }) as unknown as SelfDescribingJson;
  }

  private static generateApiUserContext(
    data: UserEventBridgePaylod['detail'],
  ): SelfDescribingJson {
    return createAPIUser({
      api_id: parseInt(data.apiId),
      name: data.name,
      is_native: data.isNative,
      is_trusted: data.isTrusted,
      client_version: data.clientVersion,
    }) as unknown as SelfDescribingJson;
  }

  /**
   * Updates tracker with request information
   * @private
   */
  private addRequestInfoToTracker(data: UserEventBridgePaylod['detail']) {
    this.tracker.setLang(data.language);
    this.tracker.setDomainUserId(data.snowplowDomainUserId); // possibly grab from cookie else grab from context
    this.tracker.setIpAddress(data.ipAddress); // get the remote address from teh x-forwarded-for header
    this.tracker.setUseragent(data.userAgent);
  }
}
