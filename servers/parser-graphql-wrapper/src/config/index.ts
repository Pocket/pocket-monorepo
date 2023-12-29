export default {
  // Same as domain prefix in .aws/src/config
  serviceName: 'parser-graphql-wrapper',
  tracing: {
    graphQLDepth: 8, // very permissive limit on depth tracing
    samplingRatio: 0.2,
    grpcDefaultPort: 4317,
    httpDefaultPort: 4318,
    serviceName: 'parser-graphql-wrapper',
    host: process.env.OTLP_COLLECTOR_HOST || 'otlpcollector',
  },
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    serverPort: 4001,
  },
  redis: {
    primaryEndpoint: process.env.REDIS_PRIMARY_ENDPOINT || 'localhost',
    readerEndpoint: process.env.REDIS_READER_ENDPOINT || 'localhost',
    port: process.env.REDIS_PORT ?? '6379',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  shortUrl: {
    apiId: 106698, //braze consumer
    userId: 59868094, //test user account
    serviceId: 10, //arbitary value for now
    //data fetched from: Web/symfony_config/.env
    //https://github.com/Pocket/Web/blob/16a0b582dfbd443d18f96f0f54163a9d50f3f6ab/symfony_config/.env#L160
    short_prefix: process.env.SHORT_PREFIX || 'local.co/b',
    short_prefix_secure: process.env.SHORT_PREFIX_SECURE || 'local.co/a',
    shortCodeChars: 'abcdefghijklmnnopqrstuvwxyz',
    collectionUrl:
      process.env.COLLECTIONS_URL || 'https://getpocket.com/collections',
  },
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  pocketSharedRds: {
    host: process.env.POCKET_SHARES_DATABASE_WRITE_HOST || 'localhost',
    port: 3306,
    username: process.env.POCKET_SHARES_DATABASE_WRITE_USER || 'root',
    password: process.env.POCKET_SHARES_DATABASE_WRITE_PASSWORD || '',
  },
  parserEndpoint: process.env.PARSER_URL || 'http://example-parser.com/',
  parserRetries: 3,
};
