const name = 'ClientAPI';
const domainPrefix = 'client-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.getpocket.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const isProd = process.env.NODE_ENV === 'production';
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';
const releaseSha = process.env.CIRCLE_SHA1;

export const config = {
  name,
  isProd,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'CAPI',
  environment,
  domain,
  s3LogsBucket,
  isDev,
  releaseSha,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Shared',
    app_code: 'pocket-content-shared',
    component_code: `pocket-content-shared-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
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
  envVars: {
    graph: {
      graphId: 'pocket-client-api',
      graphVariant: graphqlVariant,
    },
  },
  tracing: {
    host: 'localhost',
  },
};
