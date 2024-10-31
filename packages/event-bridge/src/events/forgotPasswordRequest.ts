import { EventBridgeBase } from './eventBridgeBase';
import { Event } from './events';

export interface ForgotPasswordRequest extends EventBridgeBase {
  // 'source': 'web-repo';
  'detail-type': Event.FORGOT_PASSWORD;
  detail: {
    passwordResetInfo: PasswordResetInfo;
    user: User;
  };
}

interface PasswordResetInfo {
  resetPasswordToken: string;
  resetPasswordUsername: string;
  timestamp: number;
}

interface User {
  id: number;
  encodedId: string;
  email: string;
}
