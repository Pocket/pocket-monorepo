import { EventType } from '../snowplow/user/types';

const awsEnvironments = ['production', 'development'];
let localAwsEndpoint;
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  localAwsEndpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
}

let snowplowHttpProtocol = 'https';
if (!awsEnvironments.includes(process.env.NODE_ENV)) {
  snowplowHttpProtocol = 'http';
}

// Environment variables below are set in .aws/src/main.ts
export const config = {
  app: {
    name: 'Account Data Deletion',
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4015,
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
    sqs: {
      batchSize: 1,
      sharedSnowplowQueue: {
        url:
          process.env.SNOWPLOW_EVENTS_SQS_QUEUE ||
          'http://localhost:4566/queue/SharedSnowplowConsumer-Prod-SharedEventConsumer-Queue',
        dlqUrl:
          process.env.SNOWPLOW_EVENTS_DLQ_URL ||
          'http://localhost:4566/queue/SharedSnowplowConsumer-Prod-SharedEventConsumer-Queue-Deadletter',
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
    events: EventType,
    appIds: {
      //todo: make the event bridge event to send this
      //or convert from event bridge's source
      prospectApi: 'pocket-prospect-api',
      userApi: 'pocket-user-api',
      collectionApi: 'pocket-collection-api',
      shareableListsApi: 'pocket-shareable-lists-api',
    },
  },
};
