const shortName = 'ADD';

const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

export const config = {
  app: {
    name: 'batchDelete',
    environment: process.env.NODE_ENV,
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
  },
  dynamo: {
    pendingUsers: {
      tableName: `${shortName}-HistoricalDeletedUsers-Pending`,
      keyColumn: 'userId',
    },
    processedUsers: {
      tableName: `${shortName}-HistoricalDeletedUsers-Processed`,
      keyColumn: 'userId',
    },
    maxBatchSize: 12, // DynamoDB allows 25 requests per batch write; divide by two since we must delete and put to move a record
  },
  userApi: process.env.USER_API || 'https://user-api.getpocket.dev',
  retryLimit: 3,
  sentry: {
    // these values are inserted into the environment in
    // .aws/src/.ts
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
};
