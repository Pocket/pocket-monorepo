// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    serverPort: 4867,
    serviceName: 'image-api',
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
  tracing: {
    url: process.env.OTLP_COLLECTOR_URL || 'http://localhost:4318',
    serviceName: 'image-api',
    release: process.env.GIT_SHA || 'local',
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    refreshInterval: 60 * 1000, // ms
    timeout: 2 * 1000, // ms
  },
};
