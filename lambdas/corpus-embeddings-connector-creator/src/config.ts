export const config = {
  sentry: {
    dsn:
      process.env.SENTRY_DSN ||
      'https://cd9f058a92055071561d0576f1867ace@o28549.ingest.us.sentry.io/4507710135795712',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  aws: {
    region: 'us-east-1', // TODO: Configure
  },
};
