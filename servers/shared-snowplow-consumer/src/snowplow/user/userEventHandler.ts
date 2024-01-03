import { buildSelfDescribingEvent } from '@snowplow/node-tracker';
import { SelfDescribingJson } from '@snowplow/tracker-core';
import {
  EventType,
  SnowplowEventMap,
  UserEventPayloadSnowplow,
  userEventsSchema,
  Account,
  ApiUser,
  ObjectUpdate,
  User,
} from './types';
import { config } from '../../config';
import { EventHandler } from '../EventHandler';
import { getTracker } from '../tracker';

type ObjectUpdateEvent = Omit<SelfDescribingJson, 'data'> & {
  data: ObjectUpdate;
};

type AccountContext = Omit<SelfDescribingJson, 'data'> & {
  data: Account;
};

type UserContext = Omit<SelfDescribingJson, 'data'> & {
  data: User;
};

type ApiUserContext = Omit<SelfDescribingJson, 'data'> & {
  data: ApiUser;
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
  process(data: UserEventPayloadSnowplow): void {
    this.addRequestInfoToTracker(data);
    const event = buildSelfDescribingEvent({
      event: UserEventHandler.generateAccountUpdateEvent(data),
    });
    const context = UserEventHandler.generateEventContext(data);
    super.addToTrackerQueue(event, context);
  }

  /**
   * @private
   */
  private static generateAccountUpdateEvent(
    data: UserEventPayloadSnowplow,
  ): ObjectUpdateEvent {
    return {
      schema: userEventsSchema.objectUpdate,
      data: {
        trigger: SnowplowEventMap[data.eventType],
        object: 'account',
      },
    };
  }

  /**
   * @private to build event context for ACCOUNT_DELETE event.
   */
  private static generateDeleteEventAccountContext(
    data: UserEventPayloadSnowplow,
  ): AccountContext {
    return {
      schema: userEventsSchema.account,
      data: {
        object_version: 'new',
        user_id: parseInt(data.user.id),
      },
    };
  }

  private static generateAccountContext(
    data: UserEventPayloadSnowplow,
  ): AccountContext {
    return {
      schema: userEventsSchema.account,
      data: {
        object_version: 'new',
        user_id: parseInt(data.user.id),
        emails: [data.user.email],
      },
    };
  }

  private static generateEventContext(
    data: UserEventPayloadSnowplow,
  ): SelfDescribingJson[] {
    const context = [
      UserEventHandler.generateUserContext(data),
      UserEventHandler.generateApiUserContext(data),
    ];

    data.eventType == EventType.ACCOUNT_DELETE
      ? context.push(UserEventHandler.generateDeleteEventAccountContext(data))
      : context.push(UserEventHandler.generateAccountContext(data));
    return context;
  }

  private static generateUserContext(
    data: UserEventPayloadSnowplow,
  ): UserContext {
    const userDataWithoutGuid = {
      email: data.user.email,
      hashed_guid: data.user.hashedGuid,
      user_id: parseInt(data.user.id),
      hashed_user_id: data.user.hashedId,
    };

    if (data.user.guid) {
      return {
        schema: userEventsSchema.user,
        data: { ...userDataWithoutGuid, guid: data.user.guid },
      };
    }

    return {
      schema: userEventsSchema.user,
      data: { ...userDataWithoutGuid },
    };
  }

  private static generateApiUserContext(
    data: UserEventPayloadSnowplow,
  ): ApiUserContext {
    return {
      schema: userEventsSchema.apiUser,
      data: {
        api_id: parseInt(data.apiUser.apiId),
        name: data.apiUser.name,
        is_native: data.apiUser.isNative,
        is_trusted: data.apiUser.isTrusted,
        client_version: data.apiUser.clientVersion,
      },
    };
  }

  /**
   * Updates tracker with request information
   * @private
   */
  private addRequestInfoToTracker(data: UserEventPayloadSnowplow) {
    this.tracker.setLang(data.request?.language);
    this.tracker.setDomainUserId(data.request?.snowplowDomainUserId); // possibly grab from cookie else grab from context
    this.tracker.setIpAddress(data.request?.ipAddress); // get the remote address from teh x-forwarded-for header
    this.tracker.setUseragent(data.request?.userAgent);
  }
}
