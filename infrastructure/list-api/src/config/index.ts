const name = 'ListAPI';
const domainPrefix = 'list-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const prefix = `${name}-${environment}`;
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';

export const config = {
  name,
  isDev,
  prefix,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'LSTAPI',

  environment,
  rds: {
    minCapacity: 1,
    maxCapacity: isDev ? 1 : undefined,
    databaseName: 'listapi',
    masterUsername: 'pkt_listapi',
  },
  domain,
  graphqlVariant,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/list-api',
    branch,
  },
  tags: {
    service: name,
    environment,
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
