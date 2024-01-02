import { UserEventHandler } from '../../snowplow/user/userEventHandler';
import {
  EventTypeString,
  UserEventPayloadSnowplow,
} from '../../snowplow/user/types';

export type UserEventPayload = {
  userId: string;
  email: string;
  isPremium?: boolean;
  apiId: string;
  hashedId?: string;
  guid?: number;
  hashedGuid?: string;
  name?: string;
  isNative?: boolean;
  isTrusted?: boolean;
  clientVersion?: string;
  language?: string;
  snowplowDomainUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

//detail-type in event rule
//defined here:
// https://github.com/Pocket/pocket-event-bridge/blob/f462cbb1b166d937fcd62319f88c90efc7653ebc/.aws/src/event-rules/user-api-events/eventConfig.ts#L3
export const DetailTypeToSnowplowMap: Record<string, EventTypeString> = {
  'account-deletion': 'ACCOUNT_DELETE',
  'account-email-updated': 'ACCOUNT_EMAIL_UPDATED',
  'account-password-changed': 'ACCOUNT_PASSWORD_CHANGED',
};

export function userEventConsumer(requestBody: any) {
  console.log(`requestBody -> ${JSON.stringify(requestBody)}`);
  new UserEventHandler().process(getUserEventPayload(requestBody));
}

/**
 * converts the event-bridge event format to snowplow payload
 * @param eventObj event bridge event format
 */
export function getUserEventPayload(eventObj: any): UserEventPayloadSnowplow {
  const eventPayload: UserEventPayload = eventObj['detail'];
  const detailType = eventObj['detail-type'];

  return {
    user: {
      id: eventPayload.userId,
      email: eventPayload.email,
      isPremium: eventPayload.isPremium ? true : false, //set as 0 in dev payload
      hashedId: eventPayload.hashedId,
      guid: eventPayload.guid,
      hashedGuid: eventPayload.hashedGuid,
    },
    apiUser: {
      apiId: eventPayload.apiId,
      name: eventPayload.name,
      isNative: eventPayload.isNative,
      isTrusted: eventPayload.isTrusted,
      clientVersion: eventPayload.clientVersion,
    },
    request: {
      language: eventPayload.language,
      snowplowDomainUserId: eventPayload.snowplowDomainUserId,
      ipAddress: eventPayload.ipAddress,
      userAgent: eventPayload.userAgent,
    },
    eventType: DetailTypeToSnowplowMap[detailType],
  };
}
