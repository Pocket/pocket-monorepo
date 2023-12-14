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
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';

const appPort = 4867;

const cacheNodes = 2;
// no/low utilization, setting to smallest instance available in dev and prod
const cacheSize = isDev ? 'cache.t3.micro' : 'cache.t3.micro';

export const config = {
  name,
  isDev,
  isProd,
  prefix,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'IMGAPI',
  appPort,
  environment,
  domain,
  graphqlVariant,
  cacheNodes,
  cacheSize,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/image-api',
    branch,
  },
  tags: {
    service: name,
    environment,
  },
};
