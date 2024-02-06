export type UserEventBridgePaylod = {
  detail: User;
  'detail-type': EventType;
  source: 'user-events' | string;
};

export type EventType =
  | 'account-deletion'
  | 'account-email-updated'
  | 'account-password-changed';

export type User = {
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

//   export const SnowplowEventMap: Record<EventTypeString, SnowplowEventType> = {
//     ACCOUNT_DELETE: 'account_delete',
//     ACCOUNT_EMAIL_UPDATED: 'account_email_updated',
//     ACCOUNT_PASSWORD_CHANGED: 'account_password_changed',
//   };
