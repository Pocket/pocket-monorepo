import { PocketEventType } from './events';
import {
  ForgotPasswordRequest,
  AccountDelete,
  AccountEmailUpdated,
  PremiumPurchaseEvent,
  AccountRegistration,
} from './types';
export * from './types';
export * from './events';

export type PocketEvent =
  | ForgotPasswordRequest
  | AccountDelete
  | AccountEmailUpdated
  | AccountRegistration
  | PremiumPurchaseEvent;

export type PocketEventTypeMap = {
  [PocketEventType.FORGOT_PASSWORD]: ForgotPasswordRequest;
  [PocketEventType.ACCOUNT_DELETION]: AccountDelete;
  [PocketEventType.ACCOUNT_EMAIL_UPDATED]: AccountEmailUpdated;
  [PocketEventType.ACCOUNT_REGISTRATION]: AccountRegistration;
  [PocketEventType.PREMIUM_PURCHASE]: PremiumPurchaseEvent;
};
