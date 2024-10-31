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
  timestamp: number;
}

interface User {
  id: number;
  encodedId: string;
  email: string;
}
