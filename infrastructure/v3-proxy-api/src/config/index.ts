const name = 'V3ProxyApi';
const domainPrefix = 'v3-proxy-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const port = 4030;
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';

export const config = {
  name,
  isDev,
  port,
  s3LogsBucket,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'v3Prxy', // max 6 characters
  environment,
  domainPrefix,
  domain,
  healthCheck: {
    command: [
      'CMD-SHELL',
      `curl -f http://localhost:${port}/.well-known/server-health || exit 1`,
    ],
    interval: 15,
    retries: 3,
    timeout: 5,
    startPeriod: 0,
  },
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
