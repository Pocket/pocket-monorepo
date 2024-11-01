import { BaseEvent } from './base';
import { PocketEventType } from '../events';

export interface PremiumPurchaseEvent extends BaseEvent {
  // 'source': 'web-repo';
  'detail-type': PocketEventType.PREMIUM_PURCHASE;
  detail: {
    purchase: Purchase;
    user: PremiumUser;
  };
}

export interface Purchase {
  amount: string;
  cancelAtPeriodEnd: boolean;
  isFree: boolean;
  isTrial: boolean;
  planInterval: string;
  planType: string;
  receiptId: string;
  renewDate: string;
}

export interface PremiumUser {
  email: string;
  encodedId: string;
  id: number;
}
