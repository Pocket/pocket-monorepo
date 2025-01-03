import { BaseEvent } from './base.ts';
import { PocketEventType } from '../events.ts';

export type AccountEvent =
  | AccountDelete
  | AccountEmailUpdated
  | AccountRegistration
  | AccountPasswordChanged;

export type AccountPocketEventType =
  | PocketEventType.ACCOUNT_DELETION
  | PocketEventType.ACCOUNT_EMAIL_UPDATED
  | PocketEventType.ACCOUNT_REGISTRATION
  | PocketEventType.ACCOUNT_PASSWORD_CHANGED;

export interface AccountDelete extends BaseEvent {
  // 'source': 'user-event';
  'detail-type': PocketEventType.ACCOUNT_DELETION;
  detail: AccountPayload;
}

export interface AccountEmailUpdated extends BaseEvent {
  // 'source': 'user-event';
  'detail-type': PocketEventType.ACCOUNT_EMAIL_UPDATED;
  detail: AccountPayload;
}

export interface AccountPasswordChanged extends BaseEvent {
  // 'source': 'user-event';
  'detail-type': PocketEventType.ACCOUNT_PASSWORD_CHANGED;
  detail: AccountPayload;
}

export interface AccountRegistration extends BaseEvent {
  // 'source': 'web-repo';
  'detail-type': PocketEventType.ACCOUNT_REGISTRATION;
  detail: {
    email: string;
    encodedUserId: string;
    userId: string;
    locale: string;
  };
}

export interface ExportReady extends BaseEvent {
  // 'source': 'account-data-deleter';
  'detail-type': PocketEventType.EXPORT_READY;
  detail: {
    encodedId: string;
    requestId: string;
    archiveUrl?: string | null;
  };
}

export interface AccountPayload {
  email: string;
  isPremium: boolean;
  userId: string;
  apiId: string;
  hashedId?: string | null;
  guid?: number | null;
  hashedGuid?: string | null;
  name?: string | null;
  isNative?: boolean | null;
  isTrusted?: boolean | null;
  clientVersion?: string | null;
  language?: string | null;
  snowplowDomainUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;

  // Note these are not the same as the Event Bridge fields
  // At some point we added these fields to the event payload, seperately from EventBridge default fields
  timestamp: number;
  version: string;
  eventType: string;
  traceId?: string | null;
}
