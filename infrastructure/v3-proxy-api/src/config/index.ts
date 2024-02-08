const name = 'V3ProxyApi';
const domainPrefix = 'v3-proxy-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const port = 4029;

export const config = {
  name,
  isDev,
  port,
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
  },
};
