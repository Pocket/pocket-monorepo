export type BaseEventBusPayload = {
  timestamp: number;
  version: string;
  eventType: string;
};

/**
 * Base payload containing common properties for accounts events.
 * Basically a flattened version of the type BasicUserEventPayloadWithContext in src/events/eventType.
 */
export type BaseAccountEventBusPayload = {
  userId: string;
  email: string;
  apiId: string;
  isPremium: boolean;
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

/**
 * Both, ACCOUNT_DELETION and ACCOUNT_EMAIL_UPDATED send identical fields to event bridge.
 * Only the eventType property will be different. Hence, consolidating them under this type.
 */
export type UserEventsPayload = BaseEventBusPayload &
  BaseAccountEventBusPayload;

export type EventHandlerCallbackMap = {
  [key: string]: (data: any) => BaseEventBusPayload;
};

export enum EventBridgeEventType {
  ACCOUNT_DELETION = 'account-deletion',
  ACCOUNT_EMAIL_UPDATED = 'account-email-updated',
}
