export const config = {
  endpoint: process.env.USER_LIST_SEARCH_URI || 'http://localhost:4000',
  accountDeletePath: '/batchDelete',
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
