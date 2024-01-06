import { Strategy } from 'unleash-client';
import { UnleashContext } from '../../graphql/typeDefs';
import normalizedValue from 'unleash-client/lib/strategy/util';
import { pocketSupportedLocales } from '../../utils/pocketSupportedLocales';
import { StartDateError } from '../../utils/customErrors';
import { SessionIdError } from '../../utils/customErrors';
import * as Sentry from '@sentry/node';

export class NewUserInLocaleStrategy extends Strategy {
  constructor() {
    super('newUserInLocale');
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

      // Check for language
      const passedLocale = context?.properties?.locale || 'en';
      const specifiedLocales = parameters.locales?.toString()?.split(',') || [];
      const locale =
        pocketSupportedLocales.indexOf(passedLocale) >= 0 ? passedLocale : 'en';
      const inLocaleList = specifiedLocales.indexOf(locale) >= 0;

      // if user's locale is not specified in the activation strategy in Unleash,
      // do not assign them to the test
      if (!inLocaleList) return false;

      // Check for valid start date
      const startDate = Date.parse(parameters?.startDate);
      if (isNaN(startDate)) {
        throw new StartDateError(`Invalid (NaN): ${parameters?.startDate}`);
      }

      // Check for valid accountCreatedAt
      const passedAccountCreatedAt = context?.properties?.accountCreatedAt;
      const accountCreatedAt = Date.parse(passedAccountCreatedAt); //prettier-ignore
      if (isNaN(accountCreatedAt)) return false; // assume a logged out user

      // Make sure user is eligible to fall into the test
      const isEligible = accountCreatedAt > startDate;
      if (!isEligible) return false;

      const normalizedUserId = normalizedValue(stickinessId, groupId);
      return percentage > 0 && normalizedUserId <= percentage;
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('Strategy', 'NewUserInLocale');
        Sentry.captureMessage(err);
      });
      // Don't assign anyone if the dates are not valid
      return false;
    }
  }
}

/**
 * ------------------------------------------------
 * QUERY
 * Use this query in the Apollo GraphQL editor
 * to test flag assignment
 * ------------------------------------------------

query NewUserInLocale{
  #expect false assignment
  badSessionId: unleashAssignments(context: {
		sessionId: "",
    properties: {
    	accountCreatedAt: "2022-01-01 00:00:00",
      locale: "en"
  	}
  }) {
    assignments {
      assigned
      name
    	payload
    }
  }

  #expect true assignment
  localeTrue: unleashAssignments(context: { 
		sessionId: "12345",
    userId: "123412341234",
    properties: {
    	accountCreatedAt: "2022-01-01 00:00:00",
      locale: "en"
  	}
  }) {
    assignments {
      assigned
      name
    	payload
    }
  }

  #expect false assignment
  localeFalse: unleashAssignments(context: {
		sessionId: "12345",
    userId: "123412341234",
    properties: {
    	accountCreatedAt: "2022-01-01 00:00:00",
      locale: "it"
  	}
  }) {
    assignments {
      assigned
      name
    	payload
    }
  }

  #expect false assignment
  localeTrueOldAccount: unleashAssignments(context: {
		sessionId: "12345",
    userId: "123412341234",
    properties: {
    	accountCreatedAt: "2012-01-01 00:00:00",
      locale: "en"
  	}
  }) {
    assignments {
      assigned
      name
    	payload
    }
  }

  #expect true assignment
  localeTrueNewAccount: unleashAssignments(context: {
		sessionId: "12345",
    userId: "123412341234",
    properties: {
    	accountCreatedAt: "2022-01-01 00:00:00",
      locale: "en"
  	}
  }) {
    assignments {
      assigned
      name
    	payload
    }
  }

  #expect false assignment
  localeTrueBadDate: unleashAssignments(context: {
		sessionId: "12345",
    userId: "123412341234",
    properties: {
    	accountCreatedAt: "2022-36-36 00:00:00",
      locale: "en"
  	}
  }) {
    assignments {
      assigned
      name
    	payload
    }
  }

  #expect true assignment
  unsuportedLocale: unleashAssignments(context: {
		sessionId: "12345",
    userId: "123412341234",
    properties: {
    	accountCreatedAt: "2022-01-01 00:00:00",
      locale: "entropy"
  	}
  }) {
    assignments {
      assigned
      name
    	payload
    }
  }
}
**/
