//please don't import other classes in config
//as this will be used by tracing and we don't want
//imports before tracing is initialized
const config = {
  memcached: {
    // this environment variable is stored as a comma delimited
    // string of servers, which is what keyv memcache expects as well
    servers: process.env.MEMCACHED_SERVERS ?? 'localhost:11212',
  },
  apollo: {
    graphVariant: process.env.GRAPHQL_VARIANT || 'development',
    defaultMaxAge: 0,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  isDev: process.env.NODE_ENV === 'development',
  isLocal: process.env.NODE_ENV === 'local',
  auth: {
    jwtIssuer: process.env.JWT_ISSUER || 'getpocket.com',
    kids: process.env.KIDS?.split(',') || ['PK11T', '8p1t74'],
    defaultKid: process.env.DEFAULT_KID || 'PK11T',
    fxaKid: process.env.FXA_KID || '8p1t74',
  },
  // Same as domain prefix in .aws/src/config
  serviceName: 'client-api',
  tracing: {
    samplingRatio: 0.2,
    grpcDefaultPort: 4317,
    httpDefaultPort: 4318,
    host: process.env.OTLP_COLLECTOR_HOST || 'otlpcollector',
  },
  nimbus: {
    enabled: process.env.NIMBUS_ENABLED ?? false,
    host: process.env.NIMBUS_HOST || 'localhost:6633',
  },
};

export default config;
