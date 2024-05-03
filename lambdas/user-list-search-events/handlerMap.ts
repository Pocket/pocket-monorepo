import { SQSRecord } from 'aws-lambda';
import { accountDeleteHandler } from './handlerFns.js';

export enum Event {
  ACCOUNT_DELETION = 'account-deletion',
}

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlerMap: {
  [key: string]: (message: SQSRecord) => Promise<void>;
} = {
  [Event.ACCOUNT_DELETION]: accountDeleteHandler,
};
