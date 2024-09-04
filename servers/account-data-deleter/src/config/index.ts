import { tables } from './tables';

const awsEnvironments = ['production', 'development'];
let localAwsEndpoint;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

// Environment variables below are set in .aws/src/main.ts
export const config = {
  app: {
    name: 'Account Data Deletion',
    serviceName: 'Account-Data-Deleter',
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4015,
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
    sqs: {
      batchSize: 1,
      accountDeleteQueue: {
        url:
          process.env.SQS_BATCH_DELETE_QUEUE_URL ||
          'http://localhost:4566/000000000000/pocket-account-data-delete-queue',
        visibilityTimeout: 10000,
        maxMessages: 1,
        waitTimeSeconds: 0,
        defaultPollIntervalSeconds: 300,
        afterMessagePollIntervalSeconds: 0.5,
        messageRetentionSeconds: 1209600, //14 days
      },
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  stripe: {
    key: process.env.STRIPE_KEY || 'somefakestripekey',
    apiVersion: '2024-06-20' as const,
    productId: 7,
  },
  database: {
    // contains tables for user, list, tags, annotations, etc.
    read: {
      host: process.env.DATABASE_READ_HOST || 'localhost',
      port: process.env.DATABASE_READ_PORT || '3306',
      user: process.env.DATABASE_READ_USER || 'pkt_accdelapi_r',
      password: process.env.DATABASE_READ_PASSWORD || '',
    },
    write: {
      host: process.env.DATABASE_WRITE_HOST || 'localhost',
      port: process.env.DATABASE_WRITE_PORT || '3306',
      user: process.env.DATABASE_WRITE_USER || 'pkt_accdelapi_w',
      password: process.env.DATABASE_WRITE_PASSWORD || '',
    },
    dbName: process.env.DATABASE || 'readitla_ril-tmp',
    tz: process.env.DATABASE_TZ || 'US/Central',
  },
  queueDelete: {
    limitOverrides: [
      {
        table: 'readitla_ril-tmp.list',
        limit: 90,
      },
    ],
    queryLimit: 300,
    tableNames: tables,
  },
  sqs: {
    accountDeleteQueue: {
      url:
        process.env.SQS_BATCH_DELETE_QUEUE_URL ||
        'http://localhost:4566/000000000000/pocket-list-delete-queue',
    },
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    refreshInterval: 60 * 1000, // ms
    timeout: 2 * 1000, // ms
    namePrefix: 'temp.backend',
    flags: {
      deletesDisabled: {
        name: 'temp.backend.account_delete_disabled',
        fallback: true,
      },
    },
  },
};
