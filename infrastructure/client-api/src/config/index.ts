const name = 'ClientAPI';
const domainPrefix = 'client-api';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.getpocket.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const isProd = process.env.NODE_ENV === 'production';
const s3LogsBucket = isDev ? 'pocket-data-items-dev' : 'pocket-data-items';
const releaseSha = process.env.CIRCLE_SHA1;

// Using a single node because I don't see a way to configure primary/replica
// nodes in the router config (just multiple node list). This is a good TODO/Apollo question
// https://www.apollographql.com/docs/router/configuration/distributed-caching
// The size was arbitrarily chosen
/*
  relevant AWS doc: https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/nodes-select-size.html#CacheNodes.SelectSize

  sounds like we need the following to make an educated guess:

  the total cache needed (in GB)
  the amount of failure in cache size we can tolerate without severely impacting db performance (in the event one node goes down)

  once we know that, we can tweak based on necessary CPU performance (which we can get through cloudwatch metrics).

  current config (1 nodes at cache.m6g.medium) = 6.38gb of memory and 2 cpus
*/
const cacheNodes = isDev ? 1 : 1;
const cacheSize = isDev ? 'cache.t3.micro' : 'cache.m6g.large';

export const config = {
  name,
  isProd,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'CAPI',
  environment,
  domain,
  cacheNodes,
  cacheSize,
  s3LogsBucket,
  isDev,
  releaseSha,
  tags: {
    service: name,
    environment,
  },
  healthCheck: {
    command: [
      'CMD-SHELL',
      'curl -f http://localhost:4001/.well-known/apollo/server-health || exit 1',
    ],
    interval: 15,
    retries: 3,
    timeout: 5,
    startPeriod: 0,
  },
  envVars: {
    graph: {
      graphId: 'pocket-client-api',
      graphVariant: graphqlVariant,
    },
  },
  tracing: {
    host: 'localhost',
  },
};
