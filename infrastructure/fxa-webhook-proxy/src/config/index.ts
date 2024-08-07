const name = 'FxAWebhookProxy';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domainPrefix = 'fxa-events';
const domain = `${domainPrefix}.${isDev ? 'getpocket.dev' : 'getpocket.com'}`;

export const config = {
  name,
  isDev,
  domain,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'FXAWP',
  environment,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
  apiGateway: {},
  sqsLambda: {
    jwtKey: `FxAWebhookProxy/${environment}/PrivateKey`,
  },
};
