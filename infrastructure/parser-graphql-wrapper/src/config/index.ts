const name = 'ParserGraphQLWrapper';
const domainPrefix = 'parser-graphql-wrapper';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';

const cacheNodes = 2;
const cacheSize = isDev ? 'cache.t3.micro' : 'cache.m6g.large';

export const config = {
  name,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'PARSER',
  graphqlVariant,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/parser-graphql-wrapper',
    branch,
  },
  isDev,
  isProd,
  environment,
  domain,
  cacheNodes,
  cacheSize,
  tags: {
    service: name,
    environment,
  },
  tracing: {
    host: 'localhost',
  },
  pocketSharedRds: {
    minCapacity: 1,
    maxCapacity: isDev ? 1 : undefined,
    databaseName: 'readitla_shares',
    masterUsername: 'share_urls',
  },
};
