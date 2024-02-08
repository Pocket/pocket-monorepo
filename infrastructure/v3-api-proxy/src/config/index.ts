const name = 'V3ProxyApi';
const domainPrefix = 'v3-proxy-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';
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
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/v3-proxy-api',
    branch,
  },
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
