export const config = {
  apiEndpoint:
    process.env.SHAREABLE_LISTS_API_URI ||
    'https://shareablelistsapi.getpocket.dev',
  deleteUserDataPath: '/deleteUserData',
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.ENVIRONMENT || 'development',
  },
};
