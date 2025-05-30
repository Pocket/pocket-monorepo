// Environment variables below are set in
// pocket-monorepo/infrastructure/shares-api/src/main.ts

const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

export const config = {
  app: {
    serviceName: 'shares-api',
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4031,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
    maxBackoff: 3000, // in ms, max amount of backoff time allowed for multiple requests
    eventBus: {
      name:
        process.env.EVENT_BUS_NAME || 'PocketEventBridge-Dev-Shared-Event-Bus',
      source: 'shares-api-events',
    },
  },
  dynamoDb: {
    sharesTable: {
      name: process.env.SHARES_TABLE || 'SHARES-local-shares',
      ttl: 365 * 24 * 60 * 60 * 1000, // ~1 year in ms
      userSalt: process.env.USERID_SALT || 'NACL',
      guidSalt: process.env.GUID_SALT || 'MSG',
    },
  },
  tracing: {
    url: process.env.OTLP_COLLECTOR_URL || 'http://localhost:4318',
    serviceName: 'shares-api',
    release: process.env.GIT_SHA || 'local',
  },
  share: {
    url: process.env.SHARE_URL || 'https://pocket.co/share',
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    refreshInterval: 60 * 1000, // ms
    timeout: 2 * 1000, // ms
  },
};
