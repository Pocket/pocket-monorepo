const name = 'AccountDataDeleter';
const constructName = 'account-data-deleter';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const prefix = `${name}-${environment}`;
const domainPrefix = 'account-data-deleter-api';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;

const userApiDomain = isDev
  ? `user-api.getpocket.dev`
  : `user-api.readitlater.com`;
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';

export const config = {
  name,
  prefix: `${name}-${environment}`,
  shortName: 'ADD',
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/account-data-deleter',
    branch,
  },
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
