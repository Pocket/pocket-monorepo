import { SQSRecord } from 'aws-lambda';
import { accountDeleteHandler } from './accountDelete';
import { premiumPurchaseHandler } from './premiumPurchaseHandler';
import { userRegistrationEventHandler } from './userRegistrationEventHandler';
import { forgotPasswordHandler } from './forgotPassword';
import { exportReadyHandler } from './listExportReady';
import { PocketEventType } from '@pocket-tools/event-bridge';

export enum Event {
  EXPORT_READY = 'list-export-ready', // source: account-data-deleter
}

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlers: {
  [key: string]: (message: SQSRecord) => Promise<any>;
} = {
  [PocketEventType.ACCOUNT_DELETION]: accountDeleteHandler,
  [PocketEventType.PREMIUM_PURCHASE]: premiumPurchaseHandler,
  [PocketEventType.ACCOUNT_REGISTRATION]: userRegistrationEventHandler,
  [PocketEventType.FORGOT_PASSWORD]: forgotPasswordHandler,
  [Event.EXPORT_READY]: exportReadyHandler,
};
