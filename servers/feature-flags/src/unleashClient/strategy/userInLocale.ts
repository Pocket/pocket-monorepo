import { Strategy } from 'unleash-client';
import { UnleashContext } from '../../graphql/typeDefs';
import { normalizedStrategyValue } from 'unleash-client/lib/strategy/util';
import * as Sentry from '@sentry/node';

export class UserInLocaleStrategy extends Strategy {
  constructor() {
    super('userInLocale');
  }

  isEnabled(parameters: any, context: UnleashContext): boolean {
    try {
      const groupId = parameters.groupId || context.featureToggle || '';
      const percentage = Number(parameters.rollout);
      const stickinessId = context.userId || context.sessionId || '';

      // Check for locale
      const locale = context?.properties?.locale;
      const specifiedLocales = parameters.locales?.toString()?.split(',') || [];
      const inLocaleList = specifiedLocales.indexOf(locale) >= 0;

      // if user's locale is not specified in the activation strategy in Unleash,
      // do not assign them to the test
      if (!inLocaleList) return false;

      const normalizedUserId = normalizedStrategyValue(stickinessId, groupId);
      return percentage > 0 && normalizedUserId <= percentage;
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('Strategy', 'UserInLocale');
        Sentry.captureMessage(err);
      });
      // Don't assign anyone if the dates are not valid
      return false;
    }
  }
}
