import { SQSRecord } from 'aws-lambda';
import { accountDeleteHandler } from './accountDelete';
import { premiumPurchaseHandler } from './premiumPurchaseHandler';
import { userRegistrationEventHandler } from './userRegistrationEventHandler';
import { forgotPasswordHandler } from './forgotPassword';
import { exportReadyHandler } from './listExportReady';

export enum Event {
  ACCOUNT_DELETION = 'account-deletion', //source: user-event
  PREMIUM_PURCHASE = 'Premium Purchase', //source: web-repo
  USER_REGISTRATION = 'User Registration', //source: web-repo
  FORGOT_PASSWORD = 'Forgot Password Request', //source: web-repo
  EXPORT_READY = 'list-export-ready', // source: account-data-deleter
}

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlers: {
  [key: string]: (message: SQSRecord) => Promise<any>;
} = {
  [Event.ACCOUNT_DELETION]: accountDeleteHandler,
  [Event.PREMIUM_PURCHASE]: premiumPurchaseHandler,
  [Event.USER_REGISTRATION]: userRegistrationEventHandler,
  [Event.FORGOT_PASSWORD]: forgotPasswordHandler,
  [Event.EXPORT_READY]: exportReadyHandler,
};
