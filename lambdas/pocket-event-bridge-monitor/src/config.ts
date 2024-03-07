export const config = {
  app: {
    name: 'pocket-event-bridge-monitor',
    environment: process.env.NODE_ENV,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
};
