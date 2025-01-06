import { accountDeleteHandler } from './accountDelete.ts';
import { premiumPurchaseHandler } from './premiumPurchaseHandler.ts';
import { userRegistrationEventHandler } from './userRegistrationEventHandler.ts';
import { forgotPasswordHandler } from './forgotPassword.ts';
import { exportReadyHandler } from './listExportReady.ts';
import { PocketEvent, PocketEventType } from '@pocket-tools/event-bridge';

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlers: {
  [key: string]: (event: PocketEvent) => Promise<any>;
} = {
  [PocketEventType.ACCOUNT_DELETION]: accountDeleteHandler,
  [PocketEventType.PREMIUM_PURCHASE]: premiumPurchaseHandler,
  [PocketEventType.ACCOUNT_REGISTRATION]: userRegistrationEventHandler,
  [PocketEventType.FORGOT_PASSWORD]: forgotPasswordHandler,
  [PocketEventType.EXPORT_READY]: exportReadyHandler,
};
