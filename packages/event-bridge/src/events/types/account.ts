import { BaseEvent } from '../eventBridgeBase';
import { PocketEventType } from '../events';

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
}
