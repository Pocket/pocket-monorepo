export const config = {
  app: {
    name: 'transactional-emails',
    environment: process.env.NODE_ENV || 'development',
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      release: process.env.GIT_SHA || '',
    },
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    ssm: {
      brazeApiKey:
        process.env.SSM_BRAZE_API_KEY_NAME ||
        '/TransactionalEmails/Dev/BRAZE_API_KEY',
    },
  },
  braze: {
    endpoint: process.env.BRAZE_ENDPOINT || 'https://rest.iad-05.braze.com',
    campaignTriggerPath: '/campaigns/trigger/send',
    userTrackPath: '/users/track',
    userAliasPath: '/users/alias/new',
    setSubscriptionPath: '/v2/subscription/status/set',
    forgotPasswordCampaignId:
      process.env.BRAZE_FORGOT_PASSWORD_CAMPAIGN_ID ||
      'asdasd-asdasd-asdasd-asdasdasd-asdas',
    accountDeletionCampaignId:
      process.env.BRAZE_ACCOUNT_DELETION_CAMPAIGN_ID ||
      'asdasd-asdasd-asdasd-asdasdasd-asdas',
    marketingSubscriptionId:
      process.env.BRAZE_MARKETING_SUBSCRIPTION_ID ||
      'asdasd-asdasd-asdasd-asdasdasd-asdas',
  },
};
