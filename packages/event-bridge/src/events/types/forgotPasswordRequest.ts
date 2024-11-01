import { BaseEvent } from '../eventBridgeBase';
import { PocketEventType } from '../events';

export interface ForgotPasswordRequest extends BaseEvent {
  // 'source': 'web-repo';
  'detail-type': PocketEventType.FORGOT_PASSWORD;
  detail: {
    passwordResetInfo: PasswordResetInfo;
    user: User;
  };
}

interface PasswordResetInfo {
  resetPasswordToken: string;
  resetPasswordUsername: string;
  /**
   * Note this is not a timestamp... its a formatted date string..
   */
  timestamp: string;
}

interface User {
  id: number;
  encodedId: string;
  email: string;
}
