// Environment variables below are set in
// pocket-monorepo/infrastructure/notes-api/src/main.ts

const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

export const config = {
  app: {
    serviceName: 'notes-api',
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4032,
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
      source: 'notes-api-events',
    },
  },
  tracing: {
    url: process.env.OTLP_COLLECTOR_URL || 'http://localhost:4318',
    serviceName: 'notes-api',
    release: process.env.GIT_SHA || 'local',
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    refreshInterval: 60 * 1000, // ms
    timeout: 2 * 1000, // ms
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    username: process.env.DATABASE_USER || 'pocket',
    password: process.env.DATABASE_PASSWORD || 'password',
    dbname: process.env.DATABASE_NAME || 'pocketnotes',
    port: parseInt(process.env.DATABASE_PORT || '5432') || 5432,
    maxPool: 10,
  },
};
