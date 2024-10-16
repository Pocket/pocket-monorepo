const name = 'ImageAPI';
const domainPrefix = 'image-api';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const environment = isDev ? 'Dev' : 'Prod';
const prefix = `${name}-${environment}`;
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const releaseSha = process.env.CIRCLE_SHA1;
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';

const appPort = 4867;

export const config = {
  name,
  isDev,
  isProd,
  prefix,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'IMGAPI',
  s3LogsBucket,
  appPort,
  environment,
  domain,
  graphqlVariant,
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
  tracing: {
    url: isDev
      ? 'https://otel-collector.getpocket.dev:443'
      : 'https://otel-collector.readitlater.com:443',
  },
};
