import { PocketEventType } from './events';
import {
  ForgotPasswordRequest,
  AccountDelete,
  AccountEmailUpdated,
  PremiumPurchaseEvent,
  AccountRegistration,
  ExportReady,
} from './types';
export * from './types';
export * from './events';

export type PocketEvent =
  | ForgotPasswordRequest
  | AccountDelete
  | AccountEmailUpdated
  | AccountRegistration
  | ExportReady
  | PremiumPurchaseEvent;

export type PocketEventTypeMap = {
  [PocketEventType.FORGOT_PASSWORD]: ForgotPasswordRequest;
  [PocketEventType.ACCOUNT_DELETION]: AccountDelete;
  [PocketEventType.ACCOUNT_EMAIL_UPDATED]: AccountEmailUpdated;
  [PocketEventType.ACCOUNT_REGISTRATION]: AccountRegistration;
  [PocketEventType.PREMIUM_PURCHASE]: PremiumPurchaseEvent;
  [PocketEventType.EXPORT_READY]: ExportReady;
};
