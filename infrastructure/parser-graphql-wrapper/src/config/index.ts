const name = 'ParserGraphQLWrapper';
const domainPrefix = 'parser-graphql-wrapper';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const releaseSha = process.env.CIRCLE_SHA1;
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';

export const config = {
  name,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'PARSER',
  graphqlVariant,
  isDev,
  isProd,
  releaseSha,
  environment,
  domain,
  s3LogsBucket,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Shared',
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
