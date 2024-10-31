import { EventBridgeBase } from '../eventBridgeBase';
import { PocketEventType } from '../events';

export interface AccountDelete extends EventBridgeBase {
  // 'source': 'user-event';
  'detail-type': PocketEventType.ACCOUNT_DELETION;
  detail: {
    email: string;
    isPremium?: boolean;
    userId: string;
  };
}
