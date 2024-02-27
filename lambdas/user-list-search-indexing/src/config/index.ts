export const config = {
  search: {
    endpoint: process.env.USER_LIST_SEARCH_URI || 'http://localhost:4000',
    itemDelete: '/itemDelete',
    itemUpdate: '/itemUpdate',
    userListImport: '/userListImport',
  },
  backfill: process.env.BACKFILL ? process.env.BACKFILL === 'true' : false,
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
