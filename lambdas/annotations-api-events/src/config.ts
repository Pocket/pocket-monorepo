export const config = {
  endpoint:
    process.env.ANNOTATIONS_API_URI || 'https://annotations-api.getpocket.dev',
  queueDeletePath: '/queueDelete',
  app: {
    name: 'annotations-api',
    environment: process.env.NODE_ENV,
  },
  sentry: {
    // these values are inserted into the environment in
    // .aws/src/.ts
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
};
