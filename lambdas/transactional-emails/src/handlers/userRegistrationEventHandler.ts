import { config } from '../config';
import * as Sentry from '@sentry/aws-serverless';
import { UserRegistrationEvent } from '../schemas/userRegistrationEvent';
import {
  generateSubscriptionPayloadForEmail,
  sendCreateUserAlias,
  sendUserTrack,
  setSubscription,
} from '../braze';
import { SQSRecord } from 'aws-lambda';
import type {
  UsersAliasObject,
  UsersTrackObject,
  V2SubscriptionStatusSetObject,
} from 'braze-api';
import { serverLogger } from '@pocket-tools/ts-logger';

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
 * validate the event payload of user-registration event
 * @param payload event payload from event-bridge
 */
export function validateEventPayload(payload: UserRegistrationEvent) {
  UserRegistrationEvent.getAttributeTypeMap().forEach((type) => {
    if (payload[type.name] == null) {
      throw new Error(`${type.name} does not exist in message`);
    }
  });
}

/**
 * function to validate payload and send the event to braze
 * @param record contains user-registration event from event-bridge
 * @returns response from braze
 */
export async function userRegistrationEventHandler(record: SQSRecord) {
  const payload: UserRegistrationEvent = JSON.parse(
    JSON.parse(record.body).Message,
  )['detail'];
  validateEventPayload(payload);
  const eventTime = new Date(
    JSON.parse(JSON.parse(record.body).Message)['time'],
  ).toISOString();
  serverLogger.info(
    `received user registration event for userId: ${payload.userId}`,
  );

  //creating user profile in braze for the user registered
  const requestBody = generateUserTrackBody(payload, eventTime);
  const userTrackResponse = await sendUserTrack(requestBody);
  if (!userTrackResponse.ok) {
    Sentry.addBreadcrumb({
      message:
        `creating user profile failed:` + JSON.stringify(userTrackResponse),
    });
    throw new Error(
      `Error ${userTrackResponse.status}: Failed to create user profile`,
    );
  }
  //creating alias for the user registered
  await sendCreateUserAlias(generateUserAliasRequestBody(payload));

  //add marketing subscription to user profile
  //set subscription to pocket hits daily for registered user
  serverLogger.info(
    `logging marketing subscription id: ${config.braze.marketingSubscriptionId}`,
  );
  const marketingSubscription: V2SubscriptionStatusSetObject =
    generateSubscriptionPayloadForEmail(
      config.braze.marketingSubscriptionId,
      true,
      [payload.email],
    );
  await setSubscription(marketingSubscription);
  return userTrackResponse;
}

/**
 * generate user registration request body for userTrack call to send to braze platform
 * payload is here: https://www.braze.com/docs/api/endpoints/user_data/post_user_track/#example-request
 * @param payload event payload from event-bridge
 * @param eventTime time of the event
 * @returns userTrack request body
 */
export function generateUserTrackBody(
  payload: UserRegistrationEvent,
  eventTime: string,
): UsersTrackObject {
  return {
    attributes: [
      {
        external_id: payload.encodedUserId,
        email: payload.email,
        pocket_locale: validateLocale(payload.locale),
        email_subscribe: 'subscribed',
      },
    ],
    events: [
      {
        external_id: payload.encodedUserId,
        name: 'user_registration',
        time: new Date(eventTime).toISOString(),
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
  payload: UserRegistrationEvent,
): UsersAliasObject {
  return {
    user_aliases: [
      {
        external_id: payload.encodedUserId,
        alias_name: payload.email,
        alias_label: 'email',
      },
    ],
  };
}
