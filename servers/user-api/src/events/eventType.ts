export enum EventType {
  ACCOUNT_DELETE = 'ACCOUNT_DELETE',
  ACCOUNT_EMAIL_UPDATED = 'ACCOUNT_EMAIL_UPDATED',
  ACCOUNT_PASSWORD_CHANGED = 'ACCOUNT_PASSWORD_CHANGED',
}

export type BasicUserEventPayloadWithContext = {
  user: {
    id: string;
    hashedId?: string;
    email?: string;
    guid?: number;
    hashedGuid?: string;
    isPremium?: boolean;
  };
  apiUser: {
    apiId: string;
    name?: string;
    isNative?: boolean;
    isTrusted?: boolean;
    clientVersion?: string;
  };
  request?: {
    language?: string;
    snowplowDomainUserId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
};

export type EventTypeString = keyof typeof EventType;

export type UserEventPayload = BasicUserEventPayloadWithContext & {
  eventType: EventTypeString;
};

export type SnowplowEventType =
  | 'account_email_updated'
  | 'account_delete'
  | 'account_password_changed';

export const SnowplowEventMap: Record<EventTypeString, SnowplowEventType> = {
  ACCOUNT_DELETE: 'account_delete',
  ACCOUNT_EMAIL_UPDATED: 'account_email_updated',
  ACCOUNT_PASSWORD_CHANGED: 'account_password_changed',
};

export type UserForEvent = {
  userId: string;
  email?: string;
  isPremium?: boolean;
};
