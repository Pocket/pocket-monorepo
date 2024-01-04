import { BasicUserEventPayloadWithContext, EventType } from '../eventType';
import {
  UserEventsPayload,
  EventBridgeEventType,
  EventHandlerCallbackMap,
} from './types';

/**
 * Mapping for events
 */
export const eventMap: EventHandlerCallbackMap = {
  [EventType.ACCOUNT_DELETE]: (
    data: BasicUserEventPayloadWithContext,
  ): UserEventsPayload => {
    return {
      ...generateBaseUserEventBusPayload(
        data,
        EventBridgeEventType.ACCOUNT_DELETION,
      ),
    };
  },
  [EventType.ACCOUNT_EMAIL_UPDATED]: (
    data: BasicUserEventPayloadWithContext,
  ): UserEventsPayload => {
    return {
      ...generateBaseUserEventBusPayload(
        data,
        EventBridgeEventType.ACCOUNT_EMAIL_UPDATED,
      ),
    };
  },
};

/**
 *
 * @param data
 * @param eventType
 * @returns An object for User events payload
 */
const generateBaseUserEventBusPayload = (
  data: BasicUserEventPayloadWithContext,
  eventType: EventBridgeEventType,
): UserEventsPayload => {
  return {
    userId: data.user.id,
    email: data.user.email,
    isPremium: data.user.isPremium,
    apiId: data.apiUser.apiId,
    hashedId: data.user.hashedId,
    guid: data.user.guid,
    hashedGuid: data.user.hashedGuid,
    name: data.apiUser.name,
    isNative: data.apiUser.isNative,
    isTrusted: data.apiUser.isTrusted,
    clientVersion: data.apiUser.clientVersion,
    language: data.request?.language,
    snowplowDomainUserId: data.request?.snowplowDomainUserId,
    ipAddress: data.request?.ipAddress,
    userAgent: data.request?.userAgent,
    version: '1.0.0',
    timestamp: Math.round(new Date().getTime() / 1000),
    eventType: eventType,
  };
};
