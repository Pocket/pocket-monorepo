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

const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';
const prefix = `${name}-${environment}`;

export const config = {
  name,
  isDev,
  isProd,
  prefix,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'SLAPI',
  releaseSha,
  environment,
  domain,
  graphqlVariant,
  rds,
  s3LogsBucket,
  reservedConcurrencyLimit: 1, // A maximum of 1 instance of the Lambda shall be running at whatever time needed.
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
  export: {
    queue: `${prefix}-SharedList-Export`,
    requestTopic: `PocketEventBridge-${environment}-ListEvents`,
  },
  eventBusName,
  lambda: {
    snsTopicName: {
      userEvents: `PocketEventBridge-${environment}-UserEvents`,
    },
  },
};
