const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;

let snowplowHttpProtocol = 'https';
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  snowplowHttpProtocol = 'http';
}

// Environment variables below are set in .aws/src/main.ts
export const config = {
  app: {
    name: 'Shared Snowplow Consumer',
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4015,
  },
  tracing: {
    graphQLDepth: 8, // very permissive limit on depth tracing
    samplingRatio: 0.01,
    grpcDefaultPort: 4317,
    httpDefaultPort: 4318,
    serviceName: 'shared-snowplow-consumer',
    host: process.env.OTLP_COLLECTOR_HOST || 'localhost',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
    sqs: {
      batchSize: 1,
      sharedSnowplowQueue: {
        url:
          process.env.SNOWPLOW_EVENTS_SQS_QUEUE ||
          'http://localhost:4566/000000000000/SharedSnowplowConsumer-Prod-SharedEventConsumer-Queue',
        dlqUrl:
          process.env.SNOWPLOW_EVENTS_DLQ_URL ||
          'http://localhost:4566/000000000000/SharedSnowplowConsumer-Prod-SharedEventConsumer-Queue-Deadletter',
        visibilityTimeout: 10000,
        maxMessages: 1,
        waitTimeSeconds: 0,
        defaultPollIntervalSeconds: 300,
        afterMessagePollIntervalSeconds: 0.1, // every 100ms
        messageRetentionSeconds: 1209600, //14 days
      },
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  snowplow: {
    endpoint: process.env.SNOWPLOW_ENDPOINT || 'localhost:9090',
    httpProtocol: snowplowHttpProtocol,
    bufferSize: 1,
    retries: 3,
    appId: 'pocket-snowplow-consumer',
    appIds: {
      //todo: make the event bridge event to send this
      //or convert from event bridge's source
      prospectApi: 'pocket-prospect-api',
      userApi: 'pocket-user-api',
      collectionApi: 'pocket-collection-api',
      shareableListsApi: 'pocket-shareable-lists-api',
      // todo: kat - confused about this; why not use event bridge
      // source or update the source field?
      // todo: kat - set this as the source field for events?
      sharesApi: 'pocket-shares-api',
      searchApi: 'pocket-search-api',
    },
  },
};
