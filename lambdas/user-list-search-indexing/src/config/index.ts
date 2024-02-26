 export const config = {
    search: {
      itemDelete: process.env.SEARCH_ENDPOINT || 'http://localhost:1234/userItemDelete',
      itemUpdate: process.env.SEARCH_ENDPOINT || 'http://localhost:1234/userItemUpdate'
    },
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      release: process.env.GIT_SHA || '',
      environment: process.env.NODE_ENV || 'development',
    },
  };
