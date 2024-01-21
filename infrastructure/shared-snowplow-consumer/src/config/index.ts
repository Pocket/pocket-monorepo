const name = 'SharedSnowplowConsumer';
const domainPrefix = 'shared-snowplow-consumer';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';

//Arbitrary size and count for cache. No logic was used in deciding this.
const cacheNodes = isDev ? 2 : 2;
const cacheSize = isDev ? 'cache.t2.micro' : 'cache.t3.medium';

const snowplowEndpoint = isDev
  ? 'com-getpocket-prod1.mini.snplow.net'
  : 'com-getpocket-prod1.collector.snplow.net';

export const config = {
  name,
  isDev,
  domainPrefix,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'SSPC', //change to your service name, limit to 6 characters, match shared-infrastructure short name
  environment,
  domain,
  graphqlVariant,
  cacheNodes,
  cacheSize,
  tracing: {
    host: 'localhost',
  },
  healthCheck: {
    command: [
      'CMD-SHELL',
      'curl -f http://localhost:4001/.well-known/apollo/server-health || exit 1',
    ],
    interval: 15,
    retries: 3,
    timeout: 5,
    startPeriod: 0,
  },
  tags: {
    service: name,
    environment,
  },
  eventBridge: {
    prefix: 'PocketEventBridge',
    userTopic: 'UserEventTopic',
    prospectEventTopic: 'ProspectEventTopic',
    shareableListEventTopic: 'ShareableListEventTopic',
    shareableListItemEventTopic: 'ShareableListItemEventTopic',
    collectionEventTopic: 'CollectionEventTopic',
  },
  envVars: {
    snowplowEndpoint: snowplowEndpoint,
    ecsEndpoint: `https://${domain}`,
  },
};
