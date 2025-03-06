const name = 'AccountDataDeleter';
const constructName = 'account-data-deleter';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const environment = isDev ? 'Dev' : 'Prod';
const prefix = `${name}-${environment}`;
const domainPrefix = 'account-data-deleter-api';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const userApiDomain = isDev
  ? `user-api.getpocket.dev`
  : `user-api.readitlater.com`;
const releaseSha = process.env.CIRCLE_SHA1;

export const config = {
  name,
  prefix: `${name}-${environment}`,
  shortName: 'ADD',
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  constructName,
  domain,
  releaseSha,
  eventBusName: `PocketEventBridge-${environment}-Shared-Event-Bus`,
  dynamodb: {
    historicalDeletedUsers: {
      tableName: 'HistoricalDeletedUsers-Pending',
      key: 'userId',
    },
    processedDeletedUsers: {
      tableName: 'HistoricalDeletedUsers-Processed',
      key: 'userId',
    },
  },
  environment,
  envVars: {
    databasePort: '3306',
    sqsBatchDeleteQueueName: `${prefix}-Sqs-Batch-Delete-Consumer-Queue`,
    listExportQueueName: `${prefix}-List-Export`,
    exportRequestQueueName: `${prefix}-Export-Request`,
    annotationsExportQueueName: `${prefix}-Annotations-Export`,
    listImportFileQueue: `${prefix}-List-Import-Files`,
    listImportBatchQueue: `${prefix}-List-Import-Batches`,
    databaseTz: 'US/Central',
    eventBusName: `PocketEventBridge-${environment}-Shared-Event-Bus`,
  },
  isDev,
  isProd,
  lambda: {
    snsTopicName: {
      userEvents: `PocketEventBridge-${environment}-UserEvents`,
      listEvents: `PocketEventBridge-${environment}-ListEvents`,
      exportUpdateEvents: `PocketEventBridge-${environment}-ListExportReadyEvents`,
    },
    batchDeleteLambda: {
      name: 'BatchDeleteLambda',
      reservedConcurrencyLimit: 1,
      trigger: '30 minutes',
    },
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
  tracing: {
    url: isDev
      ? 'https://otel-collector.getpocket.dev:443'
      : 'https://otel-collector.readitlater.com:443',
  },
  userApiDomain,
};
