import { SQSRecord } from 'aws-lambda';
import { accountDeleteHandler } from './accountDeleteHandler';
import { accountMergeHandler } from './accountMergeHandler';

export enum Event {
  ACCOUNT_DELETION = 'account-deletion',
  //changing it to web-repo for event replay
  //will change it back to user-merge after fixing in web repo
  ACCOUNT_MERGE = 'web-repo',
}

// Mapping of detail-type (via event bridge message)
// to function that should be invoked to process the message
export const handlers: {
  [key: string]: (message: SQSRecord) => Promise<void>;
} = {
  [Event.ACCOUNT_DELETION]: accountDeleteHandler,
  [Event.ACCOUNT_MERGE]: accountMergeHandler,
};
