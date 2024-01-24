const environment = process.env.ENVIRONMENT || 'development';
const isDev = environment === 'development';

const config = {
  app: {
    name: 'Sqs-FxA-Events-Lambda',
    environment: environment,
    sentry: {
      // these values are inserted into the environment in
      // .aws/src/sqsLambda.ts
      dsn: process.env.SENTRY_DSN || '',
      release: process.env.GIT_SHA || '',
    },
    apiId: process.env.API_ID || '99841',
    applicationName:
      process.env.APPLICATION_NAME || 'FxA Webhook Proxy Service',
  },
  aws: {
    region: process.env.REGION || 'us-east-1',
  },
  jwt: {
    key: process.env.JWT_KEY || 'FxAWebhookProxy/Dev/PrivateKey',
    iss: process.env.JWT_ISS || 'fxa-webhook-proxy',
    aud: process.env.JWT_AUD || 'https://client-api.getpocket.com/',
  },
  clientApiUri: isDev
    ? process.env.CLIENT_API_URI || 'https://client-api.getpocket.dev'
    : process.env.CLIENT_API_URI || 'https://client-api.getpocket.com',
};

export default config;
