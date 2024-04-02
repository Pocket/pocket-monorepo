const name = 'SendGridData';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domainPrefix = 'sendgrid-data';
const domain = `${domainPrefix}.${isDev ? 'getpocket.dev' : 'getpocket.com'}`;
const firehoseStream = isDev
  ? 'sendgrid-events'
  : `prod-sendgrid-events-to-braveheart`;

export const config = {
  name,
  isDev,
  domain,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'SGDATA',
  firehoseStream,
  environment,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
  },
  apiGateway: {},
};
