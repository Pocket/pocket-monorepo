const name = 'PocketRouter';
const domainPrefix = 'pocket-router';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.getpocket.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const isProd = process.env.NODE_ENV === 'production';
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';

export const config = {
  name,
  isProd,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'ROUTER',
  environment,
  domain,
  s3LogsBucket,
  isDev,
  tags: {
    service: name,
    environment,
  },
  healthCheck: {
    command: [
      'CMD-SHELL',
      'curl -f http://127.0.0.1:4000/.well-known/apollo/server-health || exit 1',
    ],
    interval: 15,
    retries: 3,
    timeout: 5,
    startPeriod: 0,
  },
  envVars: {
    graph: {
      graphId: 'pocket-client-api',
      graphVariant: graphqlVariant,
    },
  },
};
