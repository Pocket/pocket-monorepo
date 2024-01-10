// TODO: verify defaults below
const environment = process.env.ENVIRONMENT || 'development';

export default {
  environment,
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    maxRetries: 12,
    firehose: {
      deliveryStreamName: process.env.AWS_FIREHOSE_DELIVERY_STREAM_NAME || '',
    },
    cloudwatch: {
      metricNamespace: process.env.AWS_CLOUDWATCH_METRIC_NAMESPACE || '',
      // each entry is an object of event property to dimension name, and will generate an additional metric for each combo of dimensions
      metricDimensions: [
        { accountId: 'AccountId' },
        { accountId: 'AccountId', computedCampaignName: 'Campaign' },
      ],
      metricsPerRequest: 20,
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
};
