import { Strategy } from 'unleash-client';
import { UnleashContext, RecItUserProfile } from '../../graphql/typeDefs';
import { normalizedStrategyValue } from 'unleash-client/lib/strategy/util';
import * as Sentry from '@sentry/node';

export class HasUserModel extends Strategy {
  constructor() {
    super('hasUserModel');
  }

  isEnabled(parameters: any, context: UnleashContext): boolean {
    try {
      const groupId = parameters.groupId || context.featureToggle || '';
      const percentage = Number(parameters.rollout);
      const stickinessId = context.userId || context.sessionId || '';

      // Users without a user profile are not eligible.
      const userProfileString = context?.properties?.recItUserProfile;
      if (!userProfileString) return false;

      // recItUserProfile is a JSON-encoded string because Unleash does not support arrays or objects as parameters.
      const userProfile: RecItUserProfile = JSON.parse(userProfileString);

      // userProfile.userModels needs to contain parameters.userModel, the user model that we specify in the admin tool.
      if (!userProfile.userModels.includes(parameters.userModel)) return false;

      const normalizedUserId = normalizedStrategyValue(stickinessId, groupId);
      return percentage > 0 && normalizedUserId <= percentage;
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('Strategy', 'HasUserModel');
        Sentry.captureMessage(err);
      });
      // Don't assign anyone if the dates are not valid
      return false;
    }
  }
}
