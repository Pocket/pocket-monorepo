import { ForgotPasswordRequest } from './forgotPasswordRequest';
import { Event } from './events';
export * from './forgotPasswordRequest';
export * from './events';

export type PocketEvent = ForgotPasswordRequest;

export type PocketEventTypeMap = {
  [Event.FORGOT_PASSWORD]: ForgotPasswordRequest;
};
