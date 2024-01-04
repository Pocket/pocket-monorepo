import { EVENT } from './types';

const environment = process.env.ENVIRONMENT || 'development';

const config = {
  environment,
  name: 'ApiGateway-FxA-Events-Lambda',
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
  aws: {
    endpoint: process.env.AWS_ENDPOINT,
    region: process.env.AWS_REGION || 'us-east-1',
    sqs: {
      fxaEventsQueue: {
        url:
          process.env.SQS_FXA_EVENTS_URL ||
          'http://localhost:4566/000000000000/fxa-events-queue',
      },
    },
  },
  fxa: {
    // Represents a map of FxA event schemas and their corresponding events on Pocket
    // FxA events source: https://github.com/mozilla/fxa/blob/main/packages/fxa-event-broker/README.md
    allowedEvents: {
      'https://schemas.accounts.firefox.com/event/profile-change':
        EVENT.PROFILE_UPDATE,
      'https://schemas.accounts.firefox.com/event/delete-user':
        EVENT.USER_DELETE,
      'https://schemas.accounts.firefox.com/event/apple-user-migration':
        EVENT.APPLE_MIGRATION,
      'https://schemas.accounts.firefox.com/event/password-change':
        EVENT.PASSWORD_CHANGE,
    },
    // These should not change unless explicitly communicated by the FxA team
    // source: "https://accounts.firefox.com/.well-known/openid-configuration"
    issuer: 'https://accounts.firefox.com',

    // This should always be "https://accounts.firefox.com/.well-known/openid-configuration"
    // unless a different URI is explicitly communicated by the FxA team
    openIdConfigUrl:
      'https://accounts.firefox.com/.well-known/openid-configuration',
  },
};

export default config;
