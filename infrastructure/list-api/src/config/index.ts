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
    minCapacity: 1,
    maxCapacity: isDev ? 1 : undefined,
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
  },
  envVars: {
    databasePort: '3306',
    sqsPublisherDataQueueName: 'pocket-publisher-data-queue',
    sqsBatchDeleteQueueName: `${prefix}-Sqs-Batch-Delete-Consumer-Queue`,
    sqsPermLibItemMainQueueName: `PermLib-${environment}-ItemMain`,
    unifiedEventStreamName: 'unified_event',
    databaseTz: 'US/Central',
    eventBusName: `PocketEventBridge-${environment}-Shared-Event-Bus`,
  },
  lambda: {
    snsTopicName: {
      userEvents: `PocketEventBridge-${environment}-UserEventTopic`,
    },
  },
  tracing: {
    host: 'localhost',
  },
};
