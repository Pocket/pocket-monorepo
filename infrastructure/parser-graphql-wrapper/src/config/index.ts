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
    app_code: 'pocket-content-shared',
    component_code: `pocket-content-shared-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
  dynamodb: {
    itemSummaryTable: {
      key: 'urlHash',
    },
  },
  pocketSharedRds: {
    minCapacity: 0.5,
    maxCapacity: isDev ? 1 : 16,
    databaseName: 'readitla_shares',
    masterUsername: 'share_urls',
  },
};
