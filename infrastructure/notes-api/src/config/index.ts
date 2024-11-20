const name = 'NotesAPI';
const domainPrefix = 'notes';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const appPort = 4032;
const releaseSha = process.env.CIRCLE_SHA1;
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';
const eventBusName = `PocketEventBridge-${environment}-Shared-Event-Bus`;

const rds = {
  minCapacity: isDev ? 0.5 : 1,
  maxCapacity: isDev ? 0.5 : 16,
};

export const config = {
  name,
  isDev,
  isProd,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'NOTES',
  environment,
  domain,
  port: appPort,
  graphqlVariant,
  reservedConcurrencyLimit: 1,
  releaseSha,
  eventBusName,
  s3LogsBucket,
  rds,
  healthCheck: {
    command: [
      'CMD-SHELL',
      `curl -f http://localhost:${appPort}/.well-known/apollo/server-health || exit 1`,
    ],
    interval: 15,
    retries: 3,
    timeout: 5,
    startPeriod: 0,
  },
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
  envVars: {
    databasePort: '5432',
    sqsBatchDeleteQueueName: `${name}-${environment}-Batch-Delete-Consumer-Queue`,
    snsUserEventsTopic: `PocketEventBridge-${environment}-UserEvents`,
  },
  tracing: {
    url: isDev
      ? 'https://otel-collector.getpocket.dev:443'
      : 'https://otel-collector.readitlater.com:443',
  },
};
