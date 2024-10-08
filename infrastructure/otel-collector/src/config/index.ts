const name = 'OtelCollector';
const domainPrefix = 'otel-collector';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const isProd = process.env.NODE_ENV === 'production';
const releaseSha = process.env.CIRCLE_SHA1;

export const config = {
  name,
  isProd,
  prefix: `${name}-${environment}`,
  shortName: 'OTEL',
  environment,
  domain,
  isDev,
  releaseSha,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Shared',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
  healthCheck: {
    command: ['CMD-SHELL', 'curl -f http://localhost/status || exit 1'],
    interval: 15,
    retries: 3,
    timeout: 5,
    startPeriod: 0,
  },
};
