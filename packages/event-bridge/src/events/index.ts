import { PocketEventType } from './events';
import {
  ForgotPasswordRequest,
  AccountDelete,
  AccountEmailUpdated,
} from './types';
export * from './types';
export * from './events';

export type PocketEvent =
  | ForgotPasswordRequest
  | AccountDelete
  | AccountEmailUpdated;

export type PocketEventTypeMap = {
  [PocketEventType.FORGOT_PASSWORD]: ForgotPasswordRequest;
  [PocketEventType.ACCOUNT_DELETION]: AccountDelete;
  [PocketEventType.ACCOUNT_EMAIL_UPDATED]: AccountEmailUpdated;
};
