import { Strategy } from 'unleash-client';
import { UnleashContext } from '../../graphql/typeDefs';
import normalizedValue from 'unleash-client/lib/strategy/util';
import {
  StartDateError,
  AccountAgeError,
  SessionIdError,
} from '../../utils/customErrors';
import * as Sentry from '@sentry/node';

const DAY_IN_MILLISECONDS = 86400000;

export class AccountAgeAtStartStrategy extends Strategy {
  constructor() {
    super('accountAgeAtStart');
  }

  isEnabled(parameters: any, context: UnleashContext): boolean {
    try {
      const groupId = parameters.groupId || context.featureToggle || '';
      const percentage = Number(parameters.rollout);
      const stickinessId = context.userId || context.sessionId;

      // If there is no sticky id
      if (!stickinessId || !stickinessId?.length) {
        throw new SessionIdError('No Stickiness ID Provided');
      }

      // Check for valid start date
      const startDate = Date.parse(parameters?.startDate);
      if (isNaN(startDate)) {
        throw new StartDateError(`Invalid (NaN): ${parameters?.startDate}`);
      }

      const accountAge = parameters?.accountAge;
      if (isNaN(accountAge)) {
        throw new AccountAgeError(`Invalid (NaN): ${parameters?.accountAge}`);
      }

      // Check for valid account created at
      const passedAccountCreatedAt = context?.properties?.accountCreatedAt;
      const accountCreatedAt = Date.parse(passedAccountCreatedAt);
      if (isNaN(accountCreatedAt)) return false; // assume a logged out user

      // Make sure user is eligible to fall into the test
      const offset = accountAge * DAY_IN_MILLISECONDS;
      const acceptableAge = startDate - offset;

      // Check eligibility for test assignment
      const isEligible = acceptableAge >= accountCreatedAt;
      if (!isEligible) return false;

      const normalizedUserId = normalizedValue(stickinessId, groupId);
      return percentage > 0 && normalizedUserId <= percentage;
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('Strategy', 'AccountAgeAtStart');
        Sentry.captureMessage(err);
      });
      // Don't assign anyone if the test is not valid
      return false;
    }
  }
}
