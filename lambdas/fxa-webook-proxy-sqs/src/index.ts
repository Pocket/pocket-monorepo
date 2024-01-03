import { SQSEvent } from 'aws-lambda';
import * as Sentry from '@sentry/serverless';

import config from './config';
import {
  handleMutationErrors,
  migrateAppleUserMutation,
  passwordChangeMutation,
  submitDeleteMutation,
  submitEmailUpdatedMutation,
} from './mutations';

// these events are defined in ./gateway_lambda/config.ts
export enum EVENT {
  APPLE_MIGRATION = 'apple_migration',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_UPDATE = 'profile_update',
  USER_DELETE = 'user_delete',
}

export type FxaEvent = {
  user_id: string;
  event: EVENT;
  timestamp: number;
  user_email?: string;
  transfer_sub?: string;
};

type EmailUpdatedEvent = Omit<FxaEvent, 'event' | 'user_email'> & {
  event: EVENT.PROFILE_UPDATE;
  user_email: string;
};

function isInvalidFxaEvent(fxaEvent: FxaEvent): boolean {
  return !fxaEvent.event || !fxaEvent.user_id;
}

function isEmailUpdatedEvent(
  fxaEvent: FxaEvent
): fxaEvent is EmailUpdatedEvent {
  return !!(fxaEvent.user_email && fxaEvent.event === EVENT.PROFILE_UPDATE);
}

/**
 * Lambda handler function. Separated from the Sentry wrapper
 * to make unit-testing easier.
 * Takes records from SQS queue with events, and makes
 * the appropriate request against client-api.
 */
export async function handlerFn(event: SQSEvent) {
  await Promise.all(
    event.Records.map(async (record) => {
      const fxaEvent = JSON.parse(record.body) as FxaEvent;
      let res: any = 'UNSET';

      if (isInvalidFxaEvent(fxaEvent)) {
        throw new Error(
          `Malformed event - missing either 'event' or 'user_id': \n${JSON.stringify(
            fxaEvent
          )}`
        );
      }

      switch (fxaEvent.event) {
        case EVENT.APPLE_MIGRATION:
          if (!fxaEvent.user_email) {
            throw new Error(
              `Error processing ${record.body}: missing user_email`
            );
          }

          if (!fxaEvent.transfer_sub) {
            throw new Error(
              `Error processing ${record.body}: missing transfer_sub`
            );
          }

          res = await migrateAppleUserMutation(
            fxaEvent.user_id,
            fxaEvent.user_email,
            fxaEvent.transfer_sub
          );

          break;
        case EVENT.PASSWORD_CHANGE:
          res = await passwordChangeMutation(fxaEvent.user_id);

          break;
        case EVENT.PROFILE_UPDATE:
          // only handling email updates in this block for this event
          // early exit if no email property present
          if (!isEmailUpdatedEvent(fxaEvent)) {
            return;
          }

          res = await submitEmailUpdatedMutation(
            fxaEvent.user_id,
            fxaEvent.user_email
          );

          break;
        case EVENT.USER_DELETE:
          res = await submitDeleteMutation(fxaEvent.user_id);

          break;
      }

      // if any of the cases above match & execute a mutation, `res` will be
      // changed and we handle any potential errors
      if (res !== 'UNSET') {
        handleMutationErrors(record, fxaEvent, res);
      }
    })
  );

  return {};
}

Sentry.AWSLambda.init({
  dsn: config.app.sentry.dsn,
  release: config.app.sentry.release,
  environment: config.app.environment,
  serverName: config.app.name,
});

export const handler = Sentry.AWSLambda.wrapHandler(handlerFn);
