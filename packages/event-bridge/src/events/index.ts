import { PocketEventType } from './events';
import { ForgotPasswordRequest, AccountDelete } from './types';
export * from './types/forgotPasswordRequest';
export * from './events';

export type PocketEvent = ForgotPasswordRequest;

export type PocketEventTypeMap = {
  [PocketEventType.FORGOT_PASSWORD]: ForgotPasswordRequest;
  [PocketEventType.ACCOUNT_DELETION]: AccountDelete;
};
