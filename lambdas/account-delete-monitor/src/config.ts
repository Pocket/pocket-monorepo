export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT || undefined,
  },
  trackingTable: {
    name: process.env.EVENT_TRACKER_DYNAMO || 'ADM-local-event-table',
    key: 'id',
    daysToLive: 120,
  },
  userApi: {
    url: process.env.USER_API_URL || 'https://user-api.getpocket.dev/',
  },
  app: {
    name: 'deleteMonitor',
    environment: process.env.NODE_ENV,
  },
  sentry: {
    // these values are inserted into the environment in
    // .aws/src/.ts
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
};
