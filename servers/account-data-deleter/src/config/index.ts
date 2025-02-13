import { tables } from './tables';

const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

// Environment variables below are set in .aws/src/main.ts
export const config = {
  app: {
    name: 'Account Data Deletion',
    serviceName: 'Account-Data-Deleter',
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4015,
  },
  tracing: {
    url: process.env.OTLP_COLLECTOR_URL || 'http://localhost:4318',
    serviceName: 'account-data-deleter',
    release: process.env.GIT_SHA || 'local',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
    maxRetries: 3,
    eventBus: {
      name: process.env.EVENT_BUS_NAME || 'PocketEventBridge-Shared-Event-Bus',
    },
    sqs: {
      accountDeleteQueue: {
        name: 'account-delete',
        url:
          process.env.SQS_BATCH_DELETE_QUEUE_URL ||
          'http://localhost:4566/000000000000/pocket-account-data-delete-queue',
        visibilityTimeout: 10000,
        maxMessages: 1, // TODO(?): Must be 1
        waitTimeSeconds: 0,
        defaultPollIntervalSeconds: 300,
        afterMessagePollIntervalSeconds: 0.5,
        messageRetentionSeconds: 1209600, //14 days
        batchSize: 1, // TODO(?): Must be 1
      },
      exportQueue: {
        name: 'list-export',
        url:
          process.env.SQS_LIST_EXPORT_QUEUE_URL ||
          'http://localhost:4566/000000000000/pocket-list-export-queue',
        visibilityTimeout: 1000,
        maxMessages: 1, // Must be 1
        waitTimeSeconds: 0,
        defaultPollIntervalSeconds: 60,
        afterMessagePollIntervalSeconds: 0.5,
        messageRetentionSeconds: 1209600, //14 days
        batchSize: 1, // Must be 1
      },
      importFileQueue: {
        name: 'list-import',
        url:
          process.env.SQS_IMPORT_FILE_QUEUE_URL ||
          'http://localhost:4566/000000000000/ADD-Import-File-Processing-Queue',
        visibilityTimeout: 600,
        maxMessages: 1, // Must be 1
        waitTimeSeconds: 0,
        defaultPollIntervalSeconds: 300,
        afterMessagePollIntervalSeconds: 30,
        messageRetentionSeconds: 1209600, //14 days
        batchSize: 1, // Must be 1
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
  fxa: {
    clientId: process.env.FXA_CLIENT_ID || 'somefakeclientid',
    secret: process.env.FXA_CLIENT_SECRET || 'somefakesecret',
    oauthEndpoint: process.env.FXA_OAUTH_URL || 'https://localhost/',
    version: 'v1',
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
  listExport: {
    exportBucket:
      process.env.LIST_EXPORT_BUCKET || 'com.getpocket.list-exports',
    partsPrefix: process.env.LIST_EXPORT_PARTS_PREFIX || '',
    archivePrefix: process.env.LIST_EXPORT_ARCHIVE_PREFIX || '',
    queryLimit: 10000,
    signedUrlExpiry: 60 * 60 * 24 * 2, // 2 days in seconds,
    presignedIamUserCredentials:
      process.env.EXPORT_SIGNEDURL_USER_ACCESS_KEY_ID &&
      process.env.EXPORT_SIGNEDURL_USER_SECRET_KEY
        ? {
            accessKeyId: process.env.EXPORT_SIGNEDURL_USER_ACCESS_KEY_ID,
            secretAccessKey: process.env.EXPORT_SIGNEDURL_USER_SECRET_KEY,
          }
        : undefined,
  },
  listImport: {
    importBucket:
      process.env.LIST_IMPORTS_BUCKET || 'com.getpocket.list-imports',
    signedUrlExpiry: 120, // 2 minutes
    chunkSize: process.env.IMPORT_CHUNK_SIZE
      ? parseInt(process.env.IMPORT_CHUNK_SIZE)
      : 100,
    batchImportQueue:
      process.env.SQS_IMPORT_BATCH_QUEUE_URL ||
      'http://localhost:4566/000000000000/pocket-list-import-batch-queue',
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    refreshInterval: 60 * 1000, // ms
    timeout: 2 * 1000, // ms
    flags: {
      deletesDisabled: {
        name: 'temp.backend.account_delete_disabled',
        fallback: true,
      },
      importsDisabled: {
        name: 'perm.backend.list-import-disabled',
        fallback: true,
      },
    },
  },
};
