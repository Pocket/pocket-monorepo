import { ForgotPasswordRequest } from './types/forgotPasswordRequest';
import { PocketEventType } from './events';
export * from './types/forgotPasswordRequest';
export * from './events';

export type PocketEvent = ForgotPasswordRequest;

export type PocketEventTypeMap = {
  [PocketEventType.FORGOT_PASSWORD]: ForgotPasswordRequest;
};
