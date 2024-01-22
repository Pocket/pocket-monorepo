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
  },
  redis: {
    primaryEndpoint: process.env.REDIS_PRIMARY_ENDPOINT || 'redis',
    readerEndpoint: process.env.REDIS_READER_ENDPOINT || 'redis',
    port: process.env.REDIS_PORT ?? 6379,
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
};
