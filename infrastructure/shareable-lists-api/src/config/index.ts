const name = 'ShareableListsApi';
const domainPrefix = 'shareablelistsapi';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const rds = {
  minCapacity: 1,
  maxCapacity: isDev ? 1 : 16,
};
const eventBusName = `PocketEventBridge-${environment}-Shared-Event-Bus`;
const releaseSha = process.env.CIRCLE_SHA1;

const cacheNodes = isDev ? 2 : 2;
const cacheSize = isDev ? 'cache.t3.micro' : 'cache.t3.micro';

export const config = {
  name,
  isDev,
  isProd,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'SLAPI',
  releaseSha,
  environment,
  domain,
  graphqlVariant,
  rds,
  cacheNodes,
  cacheSize,
  reservedConcurrencyLimit: 1, // A maximum of 1 instance of the Lambda shall be running at whatever time needed.
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
  },
  eventBusName,
  lambda: {
    snsTopicName: {
      userEvents: `PocketEventBridge-${environment}-UserEventTopic`,
    },
  },
};
