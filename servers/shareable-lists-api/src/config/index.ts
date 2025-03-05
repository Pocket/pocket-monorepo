const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 0,
  },
  aws: {
    eventBus: {
      name:
        process.env.EVENT_BUS_NAME || 'PocketEventBridge-Dev-Shared-Event-Bus',
      eventBridge: {
        shareableList: {
          source: 'shareable-list-events',
        },
        shareableListItem: {
          source: 'shareable-list-item-events',
        },
      },
    },
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
  },
  export: {
    // Keep in line with servers/account-data-deleter/src/config
    bucket: {
      name: process.env.EXPORT_BUCKET || 'com.getpocket.list-exports',
      partsPrefix: 'parts',
    },
    // Number of lists to export at a time (not the number of items -- this is unlimited
    // and assumed it fits in memory)
    queryLimit: 100,
    workQueue: {
      name: 'shareablelist-export',
      url:
        process.env.EXPORT_QUEUE_URL ||
        'http://localhost:4566/000000000000/pocket-shareablelist-export-queue',
      visibilityTimeout: 1000,
      maxMessages: 1, // Must be 1
      waitTimeSeconds: 0,
      defaultPollIntervalSeconds: 60,
      afterMessagePollIntervalSeconds: 0.5,
      messageRetentionSeconds: 1209600, //14 days
      batchSize: 1, // Must be 1
    },
  },
  redis: {
    primaryEndpoint: process.env.REDIS_PRIMARY_ENDPOINT || 'localhost',
    readerEndpoint: process.env.REDIS_READER_ENDPOINT || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    isCluster: process.env.REDIS_IS_CLUSTER
      ? JSON.parse(process.env.REDIS_IS_CLUSTER)
      : false,
    isTLS: process.env.REDIS_IS_TLS
      ? JSON.parse(process.env.REDIS_IS_TLS)
      : false,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  slugify: {
    locale: 'en',
    lower: true,
    remove: /[*+~.()'"!:@]/g,
    strict: true,
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    dbname: process.env.DATABASE_NAME || 'shareablelists',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
  },
  pagination: {
    defaultPageSize: 30,
    maxPageSize: 30,
  },
};
