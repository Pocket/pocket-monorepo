// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    serviceName: 'v3-api-proxy',
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4030,
  },
  tracing: {
    host: process.env.OTLP_COLLECTOR_HOST || 'localhost',
    serviceName: 'v3-api-proxy',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  graphQLProxy: process.env.GRAPHQL_PROXY || 'https://getpocket.com/graphql',
};
