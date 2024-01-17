export const config = {
  app: {
    name: 'queueDelete',
    environment: process.env.NODE_ENV,
  },
  endpoint:
    process.env.ACCOUNT_DATA_DELETER_API_URI ||
    'https://account-data-deleter-api.getpocket.dev',
  queueDeletePath: '/queueDelete',
  stripeDeletePath: '/stripeDelete',
  sentry: {
    // these values are inserted into the environment in
    // .aws/src/.ts
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
};
