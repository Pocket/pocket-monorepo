const name = 'BrazeContentProxy';
const domainPrefix = 'braze-content-proxy';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.getpocket.com`;
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'BCP',
  environment,
  domain,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/braze-content-proxy',
    branch,
  },
  healthCheck: {
    command: [
      'CMD-SHELL',
      'curl -f http://localhost:4500/.well-known/server-health || exit 1',
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
