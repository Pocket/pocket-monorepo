// Environment variables below are set in .aws/src/main.ts

const awsEnvironments = ['production', 'development'];
let localAwsEndpoint: string = undefined;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4008,
  },
  basicHighlightLimit: 3, // non-premium users are limited to 3 highlights per item
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  aws: {
    sqs: {
      waitTimeSeconds: 20,
      batchSize: 10,
      annotationsDeleteQueue: {
        url:
          process.env.SQS_BATCH_DELETE_QUEUE_URL ||
          'http://localhost:4566/000000000000/pocket-annotations-delete-queue',
        visibilityTimeout: 300,
        maxMessages: 1,
        waitTimeSeconds: 0,
        defaultPollIntervalSeconds: 300,
        afterMessagePollIntervalSeconds: 30,
      },
    },
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
    maxBackoff: 3000, // in ms, max amount of backoff time allowed for multiple requests
  },
  dynamoDb: {
    notesTable: {
      name: process.env.HIGHLIGHT_NOTES_TABLE || 'ANNOT-local-highlight-notes',
      key: process.env.HIGHLIGHT_NOTES_KEY || 'highlightId',
      // DynamoDB does not require a schema for non-key attributes,
      // but we will configure here so we don't have to manipulate strings
      note: process.env.HIGHLIGHT_NOTES_NOTE || 'note',
      _updatedAt: 'updatedAt',
      _createdAt: 'createdAt',
      userId: 'userId',
    },
  },
  database: {
    // contains tables for user, list, tags, annotations, etc.
    read: {
      host: process.env.DATABASE_READ_HOST || 'localhost',
      port: process.env.DATABASE_READ_PORT || '3306',
      user: process.env.DATABASE_READ_USER || 'pkt_annotapi_r',
      password: process.env.DATABASE_READ_PASSWORD || '',
    },
    write: {
      host: process.env.DATABASE_WRITE_HOST || 'localhost',
      port: process.env.DATABASE_WRITE_PORT || '3306',
      user: process.env.DATABASE_WRITE_USER || 'pkt_annotapi_w',
      password: process.env.DATABASE_WRITE_PASSWORD || '',
    },
    dbName: process.env.DATABASE || 'readitla_ril-tmp',
    tz: process.env.DATABASE_TZ || 'US/Central',
  },
  queueDelete: {
    queryLimit: 500,
    itemIdChunkSize: 20,
  },
  batchDelete: {
    deleteDelayInMilliSec: 20000,
  },
  tracing: {
    host: process.env.OTLP_COLLECTOR_HOST || 'localhost',
    serviceName: 'annotations-api',
  },
};
