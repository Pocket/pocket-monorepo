const name = 'ShareableListsApi';
const domainPrefix = 'shareablelistsapi';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const rds = {
  minCapacity: 1,
  maxCapacity: isDev ? 1 : undefined,
};
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';
const eventBusName = `PocketEventBridge-${environment}-Shared-Event-Bus`;

const cacheNodes = isDev ? 2 : 2;
const cacheSize = isDev ? 'cache.t3.micro' : 'cache.t3.micro';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'SLAPI',
  environment,
  domain,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/shareable-lists-api',
    branch,
  },
  graphqlVariant,
  rds,
  cacheNodes,
  cacheSize,
  reservedConcurrencyLimit: 1, // A maximum of 1 instance of the Lambda shall be running at whatever time needed.
  tags: {
    service: name,
    environment,
  },
  eventBusName,
  lambda: {
    snsTopicName: {
      userEvents: `PocketEventBridge-${environment}-UserEventTopic`,
    },
  },
};
