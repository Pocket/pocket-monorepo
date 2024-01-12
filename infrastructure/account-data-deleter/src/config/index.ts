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

export const config = {
  name,
  prefix: `${name}-${environment}`,
  shortName: 'ADD',
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  constructName,
  domain,
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
    databaseTz: 'US/Central',
  },
  isDev,
  isProd,
  lambda: {
    snsTopicName: {
      userEvents: `PocketEventBridge-${environment}-UserEventTopic`,
    },
    batchDeleteLambda: {
      name: 'BatchDeleteLambda',
      reservedConcurrencyLimit: 1,
      triggerInHours: 5,
    },
  },
  tags: {
    service: name,
    environment,
  },
  userApiDomain,
};
