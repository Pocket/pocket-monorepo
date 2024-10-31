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

  // Note these are not the same as the Event Bridge fields
  // At some point we added these fields to the event payload, seperately from EventBridge default fields
  timestamp: number;
  version: string;
  eventType: string;
}
