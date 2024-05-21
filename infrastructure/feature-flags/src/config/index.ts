const name = 'FeatureFlags';
const domainPrefix = 'featureflags';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const rds = {
  minCapacity: 2,
  maxCapacity: isDev ? 2 : 16,
};
const releaseSha = process.env.CIRCLE_SHA1;

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'FFLAGS',
  environment,
  domain,
  graphqlVariant,
  rds,
  releaseSha,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
};
