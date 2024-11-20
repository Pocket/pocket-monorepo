import { config } from '../config';
import * as Sentry from '@sentry/aws-serverless';
import {
  generateSubscriptionPayloadForEmail,
  sendCreateUserAlias,
  sendUserTrack,
  setSubscription,
} from '../braze';
import type {
  UsersAliasObject,
  UsersTrackObject,
  V2SubscriptionStatusSetObject,
} from 'braze-api';
import { serverLogger } from '@pocket-tools/ts-logger';
import {
  AccountRegistration,
  IncomingBaseEvent,
  IncomingPocketEvent,
  PocketEvent,
  PocketEventType,
} from '@pocket-tools/event-bridge';

export type AttributeForUserRegistration = {
  external_id: string;
  email: string;
  pocket_locale: string;
  email_subscribe: string;
};

export type AttributeForUserSubscription = {
  external_id: string;
  email: string;
  email_subscribe: string;
  subscription_groups: {
    subscription_group_id: string;
    subscription_state: 'subscribed' | 'unsubscribed';
  }[];
};

/**
 * function to validate payload and send the event to braze
 * @param record contains user-registration event from event-bridge
 * @returns response from braze
 */
export async function userRegistrationEventHandler(
  event: PocketEvent & IncomingPocketEvent,
): Promise<Response | null> {
  if (event?.['detail-type'] === PocketEventType.ACCOUNT_REGISTRATION) {
    serverLogger.info(`received user registration event`, {
      userId: event.detail.encodedUserId,
    });

    //creating user profile in braze for the user registered
    const requestBody = generateUserTrackBody(event);
    const userTrackResponse = await sendUserTrack(requestBody);
    if (!userTrackResponse.ok) {
      serverLogger.error(`creating user profile failed`, {
        userTrackResponse: JSON.stringify(userTrackResponse),
      });
      Sentry.addBreadcrumb({
        message: `creating user profile failed`,
        data: { userTrackResponse: JSON.stringify(userTrackResponse) },
      });
      throw new Error(
        `Error ${userTrackResponse.status}: Failed to create user profile`,
      );
    }
    //creating alias for the user registered
    await sendCreateUserAlias(generateUserAliasRequestBody(event));

    //add marketing subscription to user profile
    //set subscription to pocket hits daily for registered user
    serverLogger.info(`logging marketing subscription id`, {
      subscriptionId: config.braze.marketingSubscriptionId,
    });
    const marketingSubscription: V2SubscriptionStatusSetObject =
      generateSubscriptionPayloadForEmail(
        config.braze.marketingSubscriptionId,
        true,
        [event.detail.email],
      );
    await setSubscription(marketingSubscription);
    return userTrackResponse;
  }

  return null;
}

/**
 * generate user registration request body for userTrack call to send to braze platform
 * payload is here: https://www.braze.com/docs/api/endpoints/user_data/post_user_track/#example-request
 * @param payload event payload from event-bridge
 * @param eventTime time of the event
 * @returns userTrack request body
 */
export function generateUserTrackBody(
  payload: AccountRegistration & IncomingBaseEvent,
): UsersTrackObject {
  return {
    attributes: [
      {
        external_id: payload.detail.encodedUserId,
        email: payload.detail.email,
        pocket_locale: validateLocale(payload.detail.locale),
        email_subscribe: 'subscribed',
      },
    ],
    events: [
      {
        external_id: payload.detail.encodedUserId,
        name: 'user_registration',
        time: payload.time.toISOString(),
      },
    ],
  };
}

function validateLocale(locale: string) {
  //mapping from:https://github.com/Pocket/dbt-snowflake/blob/main/macros/pocket_locale.sql
  const map = {
    en: 'en-US',
    it: 'it-IT',
    'fr-ca': 'fr-CA',
    fr: 'fr-FR',
    de: 'de-DE',
    'es-es': 'es-ES',
    es: 'es-LA',
    ja: 'ja-JP',
    nl: 'nl-NL',
    'pt-pt': 'pt-PT',
    pt: 'pt-BR',
    ru: 'ru-RU',
    'zh-tw': 'zh-TW',
    zh: 'zh-CN',
    ko: 'ko-KR',
    pl: 'pl-PL',
  };

  for (const key in map) {
    if (locale.toLocaleLowerCase().includes(key)) {
      return map[key];
    }
  }

  //default en-US if locale is not recognized
  return `en-US`;
}

export function generateUserAliasRequestBody(
  payload: AccountRegistration,
): UsersAliasObject {
  return {
    user_aliases: [
      {
        external_id: payload.detail.encodedUserId,
        alias_name: payload.detail.email,
        alias_label: 'email',
      },
    ],
  };
}
