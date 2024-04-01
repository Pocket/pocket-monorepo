const awsEnvironments = ['production', 'development'];
let localAwsEndpoint: string = undefined;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

export const config = {
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    sqs: {
      endpoint: localAwsEndpoint,
    },
  },
  database: {
    tz: 'US/Central',
    dbName: process.env.DATABASE_NAME || 'readitla_ril-tmp',
  },
  dbSecretName:
    process.env.DB_SECRET_NAME || '/InstantSyncEvents/Test/READITLA_DB',
  pushQueueUrl:
    process.env.PUSH_QUEUE_URL ||
    'http://localhost:4566/000000000000/pocket-push-queue',
};
