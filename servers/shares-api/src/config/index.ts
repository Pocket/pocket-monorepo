// Environment variables below are set in
// pocket-monorepo/infrastructure/shares-api/src/main.ts

const awsEnvironments = ['production', 'development'];
let localAwsEndpoint: string = undefined;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

export default {
  app: {
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
  },
  dynamoDb: {
    notesTable: {
      name: process.env.SHARES_TABLE || 'SHARES-local-shares',
      key: process.env.SHARES_TABLE_KEY || 'shareId',
    },
  },
  tracing: {
    host: process.env.OTLP_COLLECTOR_HOST || 'localhost',
    serviceName: 'shares-api',
  },
};
