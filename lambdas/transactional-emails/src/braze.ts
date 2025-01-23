import { config } from './config.ts';
import * as Sentry from '@sentry/aws-serverless';
import fetchRetry from 'fetch-retry';
import { getBrazeApiKey } from './ssm.ts';
import type {
  UsersTrackObject,
  UsersAliasObject,
  V2SubscriptionStatusSetObject,
  CampaignsTriggerSendObject,
} from 'braze-api';
import { serverLogger } from '@pocket-tools/ts-logger';

const fetchWithBackoff = fetchRetry(fetch);

/**
 * Make a POST request to Braze, with backoff and retry.
 * Handles logging to Sentry and Cloudwatch on error.
 */
async function brazePost(path: string, body: BodyInit) {
  const brazeApiKey = await getBrazeApiKey();
  const url = config.braze.endpoint + path;
  const res = await fetchWithBackoff(url, {
    retryOn: [500, 502, 503, 504],
    retries: 3,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${brazeApiKey}`,
    },
    body,
  });
  if (!res.ok) {
    Sentry.addBreadcrumb({
      type: 'http',
      data: {
        url,
        method: 'POST',
        status_code: res.status,
        reason: res.statusText,
      },
    });
    serverLogger.error({
      message: 'HTTP Request to Braze Failed',
      requestData: {
        url,
        method: 'POST',
        status_code: res.status,
        reason: res.statusText,
      },
    });
  }
  return res;
}

export async function sendForgotPasswordEmail(forgotPasswordOptions: {
  encodedId: string;
  resetTimeStamp: string;
  resetPasswordUsername: string;
  resetPasswordToken: string;
}) {
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

  Sentry.addBreadcrumb({
    type: 'default',
    data: {
      hashedUserId: forgotPasswordOptions.encodedId,
      resetUsername: forgotPasswordOptions.resetPasswordUsername,
    },
  });

  const body = JSON.stringify(campaignData);
  const res = await brazePost(config.braze.campaignTriggerPath, body);
  if (!res.ok) {
    throw new Error(
      `Error ${res.status}: Failed to send Forgot Password email`,
    );
  }
  return res;
}

export async function sendListExportReadyEmail(options: {
  encodedId: string;
  archiveUrl?: string;
  requestId: string;
}) {
  const campaignData: CampaignsTriggerSendObject = {
    campaign_id: config.braze.listExportReadyCampaignId,
    recipients: [
      {
        external_user_id: options.encodedId,
        trigger_properties: {
          archive_url: options.archiveUrl,
          request_id: options.requestId,
        },
      },
    ],
  };
  Sentry.addBreadcrumb({ data: { campaign: 'ListExportReady', campaignData } });

  const body = JSON.stringify(campaignData);
  const res = await brazePost(config.braze.campaignTriggerPath, body);
  if (!res.ok) {
    throw new Error(
      `Error ${res.status}: Failed to send List Export Ready email`,
    );
  }
  return res;
}

export async function sendAccountDeletionEmail(email: string) {
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
  Sentry.addBreadcrumb({
    data: { campaign: 'AccountDeletion', campaignData },
  });

  const body = JSON.stringify(campaignData);
  const res = await brazePost(config.braze.campaignTriggerPath, body);

  if (!res.ok) {
    throw new Error(
      `Error ${res.status}: Failed to send Account Deletion email`,
    );
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
  const body = JSON.stringify(requestBody);
  Sentry.addBreadcrumb({
    data: { endpoint: config.braze.userTrackPath, ...requestBody },
  });
  const res = await brazePost(config.braze.userTrackPath, body);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Failed to call User Track endpoint`);
  }
  return res;
}

/**
 * calls create user alias endpoint in braze platform
 * docs: https://www.braze.com/docs/api/endpoints/user_data/post_user_alias/#request-body
 * @param requestBody request body to create user alias
 * @returns response from braze
 */
export async function sendCreateUserAlias(requestBody: UsersAliasObject) {
  const body = JSON.stringify(requestBody);
  Sentry.addBreadcrumb({
    data: { endpoint: config.braze.userAliasPath, ...requestBody },
  });
  const response = await brazePost(config.braze.userAliasPath, body);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: Failed to create user alias`);
  }
  return response;
}

export async function setSubscription(
  requestBody: V2SubscriptionStatusSetObject,
) {
  serverLogger.info({
    message: 'Updating subscription',
    requestBody,
  });
  const body = JSON.stringify(requestBody);
  Sentry.addBreadcrumb({
    data: { endpoint: config.braze.userAliasPath, ...requestBody },
  });
  const response = await brazePost(config.braze.setSubscriptionPath, body);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: Failed to update subscription`);
  }
  return response;
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
