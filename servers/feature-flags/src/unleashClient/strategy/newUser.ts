import { Strategy } from 'unleash-client';
import { UnleashContext } from '../../graphql/typeDefs';
import { normalizedStrategyValue } from 'unleash-client/lib/strategy/util';
import { StartDateError, SessionIdError } from '../../utils/customErrors';
import * as Sentry from '@sentry/node';

export class NewUserStrategy extends Strategy {
  constructor() {
    super('newUser');
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

      // Check for valid account created at
      const passedAccountCreatedAt = context?.properties?.accountCreatedAt;
      const accountCreatedAt = Date.parse(passedAccountCreatedAt);
      if (isNaN(accountCreatedAt)) return false; // assume a logged out user

      // Make sure user is eligible to fall into the test
      const isEligible = accountCreatedAt > startDate;
      if (!isEligible) return false;

      const normalizedUserId = normalizedStrategyValue(stickinessId, groupId);
      return percentage > 0 && normalizedUserId <= percentage;
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('Strategy', 'NewUser');
        Sentry.captureMessage(err);
      });
      // Don't assign anyone if the test is not valid
      return false;
    }
  }
}
