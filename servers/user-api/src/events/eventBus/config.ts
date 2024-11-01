import { BasicUserEventPayloadWithContext, EventType } from '../eventType';
import {
  PocketEventType,
  AccountDelete,
  AccountEmailUpdated,
  AccountPayload,
} from '@pocket-tools/event-bridge';
import { EventHandlerCallbackMap } from './types';
import config from '../../config';

/**
 * Mapping for events
 */
export const eventMap: EventHandlerCallbackMap = {
  [EventType.ACCOUNT_DELETE]: (
    data: BasicUserEventPayloadWithContext,
  ): AccountDelete => {
    return {
      source: config.aws.eventBus.eventBridge.source,
      'detail-type': PocketEventType.ACCOUNT_DELETION,
      detail: generateBaseUserEventBusPayload(
        data,
        PocketEventType.ACCOUNT_DELETION,
      ),
    };
  },
  [EventType.ACCOUNT_EMAIL_UPDATED]: (
    data: BasicUserEventPayloadWithContext,
  ): AccountEmailUpdated => {
    return {
      source: config.aws.eventBus.eventBridge.source,
      'detail-type': PocketEventType.ACCOUNT_EMAIL_UPDATED,
      detail: generateBaseUserEventBusPayload(
        data,
        PocketEventType.ACCOUNT_EMAIL_UPDATED,
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
  eventType: PocketEventType,
): AccountPayload => {
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
