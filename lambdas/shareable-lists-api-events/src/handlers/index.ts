import { SQSRecord } from 'aws-lambda';
import { accountDeleteHandler } from './accountDelete';

// right hand value should map to the respective `detailType` in event bridge
export enum Event {
  ACCOUNT_DELETION = 'account-deletion',
}

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlers: {
  [key: string]: (message: SQSRecord) => Promise<void>;
} = {
  [Event.ACCOUNT_DELETION]: accountDeleteHandler,
};
