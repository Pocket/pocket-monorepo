import fetchRetry from 'fetch-retry';
import { config } from './config';
import { getBrazeApiKey } from './ssm';
import * as Sentry from '@sentry/serverless';
import type {
  UsersTrackObject,
  UsersAliasObject,
  V2SubscriptionStatusSetObject,
  CampaignsTriggerSendObject,
} from 'braze-api';
export const fetchWithBackoff = fetchRetry(fetch);

export async function sendForgotPasswordEmail(forgotPasswordOptions: {
  encodedId: string;
  resetTimeStamp: string;
  resetPasswordUsername: string;
  resetPasswordToken: string;
}) {
  const brazeApiKey = await getBrazeApiKey();

  const campaignData: CampaignsTriggerSendObject = {
    campaign_id: config.braze.forgotPasswordCampaignId,
    recipients: [
      {
        external_user_id: forgotPasswordOptions.encodedId,
        trigger_properties: {
          reset_timestamp: forgotPasswordOptions.resetTimeStamp,
          reset_password_username: forgotPasswordOptions.resetPasswordUsername,
          reset_password_token: forgotPasswordOptions.resetPasswordToken,
        },
      },
    ],
  };

  console.info('Sending forgot password email', {
    campaignData: JSON.stringify(campaignData),
  });

  const res = await fetchWithBackoff(
    config.braze.endpoint + config.braze.campaignTriggerPath,
    {
      retryOn: [500, 502, 503],
      retries: 3,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
      // https://www.braze.com/docs/api/endpoints/messaging/send_messages/post_send_triggered_campaigns/
      body: JSON.stringify(campaignData),
    },
  );

  console.info('Forgot password email response', {
    response: JSON.stringify(res),
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: Failed to send email`);
  }

  return res;
}

export async function sendAccountDeletionEmail(email: string) {
  const brazeApiKey = await getBrazeApiKey();

  const campaignData: CampaignsTriggerSendObject = {
    campaign_id: config.braze.accountDeletionCampaignId,
    recipients: [
      {
        user_alias: {
          alias_name: email,
          alias_label: 'email',
        },
      },
    ],
  };

  const res = await fetchWithBackoff(
    config.braze.endpoint + config.braze.campaignTriggerPath,
    {
      retryOn: [500, 502, 503],
      retries: 3,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
      // https://www.braze.com/docs/api/endpoints/messaging/send_messages/post_send_triggered_campaigns/
      body: JSON.stringify(campaignData),
    },
  );

  if (!res.ok) {
    throw new Error(`Error ${res.status}: Failed to send email`);
  }

  return res;
}

/**
 * calls user track endpoint in braze platform
 * braze api docs: https://www.braze.com/docs/api/objects_filters/event_object/#what-is-the-event-object
 * users/track docs: https://www.braze.com/docs/api/endpoints/user_data/post_user_track/#example-request
 * @param requestBody user track request body for creating user
 */
export async function sendUserTrack(requestBody: UsersTrackObject) {
  const brazeApiKey = await getBrazeApiKey();

  return await fetchWithBackoff(
    config.braze.endpoint + config.braze.userTrackPath,
    {
      retryOn: [500, 502, 503],
      retries: 2,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );
}

/**
 * calls create user alias endpoint in braze platform
 * docs: https://www.braze.com/docs/api/endpoints/user_data/post_user_alias/#request-body
 * @param requestBody request body to create user alias
 * @returns response from braze
 */
export async function sendCreateUserAlias(requestBody: UsersAliasObject) {
  const brazeApiKey = await getBrazeApiKey();
  const response = await fetchWithBackoff(
    config.braze.endpoint + config.braze.userAliasPath,
    {
      retryOn: [500, 502, 503],
      retries: 2,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );
  if (!response.ok) {
    Sentry.addBreadcrumb({
      message: `creating alias failed:` + JSON.stringify(response),
    });
    throw new Error(`Error ${response.status}: Failed to create user alias`);
  }
  return response;
}

export async function setSubscription(
  requestBody: V2SubscriptionStatusSetObject,
) {
  const brazeApiKey = await getBrazeApiKey();
  const response = await fetchWithBackoff(
    config.braze.endpoint + config.braze.setSubscriptionPath,
    {
      retryOn: [500, 502, 503],
      retries: 2,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );
  if (!response.ok) {
    const subscriptionGroupIds: string[] = requestBody.subscription_groups.map(
      (group) => group.subscription_group_id,
    );
    Sentry.addBreadcrumb({
      message: `subscription failed: ` + JSON.stringify(response),
    });

    throw new Error(
      `Error ${
        response.status
      }: Failed to set subscription for id: ${subscriptionGroupIds} + ${JSON.stringify(
        response.body,
      )}`,
    );
  }
}

/**
 * generates payload for set subscription by email in braze platform
 * @param subscriptionGroupId subscription group id
 * @param subscriptionState subscription state
 * @param emails emails to set subscription for
 * @returns payload for subscription set request
 */
export function generateSubscriptionPayloadForEmail(
  subscriptionGroupId: string,
  isSubscribed: boolean,
  emails: string[],
): V2SubscriptionStatusSetObject {
  return {
    subscription_groups: [
      {
        subscription_group_id: subscriptionGroupId,
        subscription_state: isSubscribed ? 'subscribed' : 'unsubscribed',
        emails: emails,
      },
    ],
  };
}
