export type Account = {
  object_version: 'new';
  user_id: number;
  hashed_user_id?: string;
  emails?: string[];
};

export type ObjectUpdate = {
  trigger: SnowplowEventType;
  object: 'account';
};

export type User = {
  email?: string;
  guid?: number;
  hashed_guid?: string;
  user_id?: number;
  hashed_user_id?: string;
};

export type ApiUser = {
  api_id: number;
  name?: string;
  is_native?: boolean;
  is_trusted?: boolean;
  client_version?: string;
};

//snowplow event type
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

export type UserEventPayloadSnowplow = BasicUserEventPayloadWithContext & {
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

export const userEventsSchema = {
  account: 'iglu:com.pocket/account/jsonschema/1-0-2',
  objectUpdate: 'iglu:com.pocket/object_update/jsonschema/1-0-16',
  user: 'iglu:com.pocket/user/jsonschema/1-0-0',
  apiUser: 'iglu:com.pocket/api_user/jsonschema/1-0-2',
};
