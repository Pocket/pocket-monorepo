// DO NOT CHANGE: circular dependency if simplified to "import { EventType } from '../businessEvents'"
import { EventType } from '../businessEvents/types';

const serviceName = 'list-api';
const awsEnvironments = ['production', 'development'];
const localAwsEndpoint =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? process.env.AWS_ENDPOINT || 'http://localhost:4566'
    : undefined;
const snowplowHttpProtocol =
  process.env.NODE_ENV && !awsEnvironments.includes(process.env.NODE_ENV)
    ? 'http'
    : 'https';

export default {
  serviceName,
  app: {
    environment: process.env.NODE_ENV || 'development',
    depthLimit: 8,
    port: 4005,
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localAwsEndpoint,
    maxRetries: 3, // maximum number of retries for aws sdk requests
    kinesis: {
      unifiedEvents: {
        streamName: 'unified_event',
        events: EventType,
      },
      maxBatch: 500, // maximum batch size for kinesis
      interval: 1000, // ms (approx) between processing batches
    },
    eventBus: {
      name: process.env.EVENT_BUS_NAME || 'PocketEventBridge-Shared-Event-Bus',
      accountDeletionEvent: { source: 'user-events' },
    },
    sqs: {
      publisherQueue: {
        events: Object.values(EventType) as string[],
        url:
          process.env.SQS_PUBLISHER_DATA_QUEUE_URL ||
          'http://localhost:4566/000000000000/pocket-publisher-data-queue',
      },
      permLibItemMainQueue: {
        events: [EventType.ADD_ITEM],
        url:
          process.env.SQS_PERMLIB_ITEMMAIN_QUEUE_URL ||
          'http://localhost:4566/000000000000/PermLib-ItemMain',
      },
      waitTimeSeconds: 20,
      batchSize: 10,
    },
  },
  awsEnvironments,
  data: {
    // A suffix that ensures the tag ID is never an empty string,
    // because there are empty tag strings in the DB
    tagIdSuffix: '__xpktxtagx__',
  },
  database: {
    // contains tables for user, list, tags, annotations, etc.
    read: {
      host: process.env.DATABASE_READ_HOST || 'localhost',
      port: process.env.DATABASE_READ_PORT || '3306',
      user: process.env.DATABASE_READ_USER || 'pkt_listapi_r',
      password: process.env.DATABASE_READ_PASSWORD || '',
    },
    write: {
      host: process.env.DATABASE_WRITE_HOST || 'localhost',
      port: process.env.DATABASE_WRITE_PORT || '3306',
      user: process.env.DATABASE_WRITE_USER || 'pkt_listapi_w',
      password: process.env.DATABASE_WRITE_PASSWORD || '',
    },
    dbName: process.env.DATABASE || 'readitla_ril-tmp',
    tz: process.env.DATABASE_TZ || 'US/Central',
    maxTransactionSize: parseInt(process.env.MAX_TRX_SIZE ?? '') || 1000,
  },
  dataloaderDefaults: {
    // TBD: batchScheduleFn: (callback) => setTimeout(callback, 10) // every 10 ms
    maxBatchSize: 1000,
  },
  events: {
    source: serviceName, // TODO - ok to change from 'backend-php'?
    version: '0.0.2', // TODO - version currently in documentation
  },
  mutationInputLimits: {
    batchUpdateTagNodesMax: 150,
  },
  pagination: {
    defaultPageSize: 30,
    maxPageSize: 100,
  },
  parserDomain: process.env.PARSER_DOMAIN || 'https://parse-sir.local',
  parserRetries: 3,
  parserVersion: process.env.PARSER_VERSION || 'v3beta',
  queueDelete: {
    queryLimit: 1000,
    itemIdChunkSize: 250,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
    samplerFlag: 'perm.backend.sentry-trace-sampler-rate',
  },
  unleash: {
    clientKey: process.env.UNLEASH_KEY || 'unleash-key-fake',
    endpoint: process.env.UNLEASH_ENDPOINT || 'http://localhost:4242/api',
    flags: {},
  },
  snowplow: {
    endpoint: process.env.SNOWPLOW_ENDPOINT || 'localhost:9090',
    httpProtocol: snowplowHttpProtocol,
    bufferSize: 1,
    retries: 3,
    appId: 'pocket-backend-list-api',
    events: EventType,
    schemas: {
      listItemUpdate: 'iglu:com.pocket/list_item_update/jsonschema/1-0-1',
      listItem: 'iglu:com.pocket/list_item/jsonschema/1-0-1',
      content: 'iglu:com.pocket/content/jsonschema/1-0-0',
      user: 'iglu:com.pocket/user/jsonschema/1-0-0',
      apiUser: 'iglu:com.pocket/api_user/jsonschema/1-0-0',
    },
  },
  tracing: {
    url: process.env.OTLP_COLLECTOR_URL || 'http://localhost:4318',
    release: process.env.GIT_SHA || '',
    serviceName,
    graphQLDepth: 8,
  },
};
