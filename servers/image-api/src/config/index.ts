// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    serverPort: 4867,
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400, //in seconds, informs the gateway how this object is cacheable at the Gateway by default
    dataloaderCacheAge: 86400, //in seconds
    imageCacheEndpoint:
      process.env.IMAGE_CACHE_ENDPOINT || 'https://endpoint.com',
  },
  redis: {
    primaryEndpoint: process.env.REDIS_PRIMARY_ENDPOINT || 'localhost',
    readerEndpoint: process.env.REDIS_READER_ENDPOINT || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
