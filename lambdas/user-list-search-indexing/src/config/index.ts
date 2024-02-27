export const config = {
  search: {
    endpoint: process.env.USER_LIST_SEARCH_URI || 'http://localhost:4000',
    itemDelete: '/userItemDelete',
    itemUpdate:
      process.env.SEARCH_ENDPOINT || 'http://localhost:1234/userItemUpdate',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
