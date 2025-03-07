const name = 'ListAPI';
const domainPrefix = 'list-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const prefix = `${name}-${environment}`;
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const releaseSha = process.env.CIRCLE_SHA1;
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';

export const config = {
  name,
  isDev,
  prefix,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'LSTAPI',
  releaseSha,
  environment,
  s3LogsBucket,
  rds: {
    minCapacity: 0.5,
    maxCapacity: isDev ? 1 : 16,
    databaseName: 'listapi',
    masterUsername: 'pkt_listapi',
  },
  domain,
  graphqlVariant,
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
    databasePort: '3306',
    sqsPublisherDataQueueName: 'pocket-publisher-data-queue',
    sqsBatchImportQueueName: `AccountDataDeleter-${environment}-List-Import-Batches`,
    sqsPermLibItemMainQueueName: `PermLib-${environment}-ItemMain`,
    unifiedEventStreamName: 'unified_event',
    databaseTz: 'US/Central',
    eventBusName: `PocketEventBridge-${environment}-Shared-Event-Bus`,
    listImportBucket: `com.getpocket-${environment.toLowerCase()}.list-imports`,
  },
  lambda: {
    snsTopicName: {
      userEvents: `PocketEventBridge-${environment}-UserEventTopic`,
    },
  },
  tracing: {
    url: isDev
      ? 'https://otel-collector.getpocket.dev:443'
      : 'https://otel-collector.readitlater.com:443',
  },
};
