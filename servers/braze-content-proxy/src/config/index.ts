export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    apolloClientName: 'BrazeContentProxy',
    version: `${process.env.GIT_SHA ?? 'local'}`,
    port: 4500,
    INVALID_API_KEY_ERROR_MESSAGE: 'Please provide a valid API key.',
  },
  aws: {
    region: process.env.REGION || 'us-east-1',
    brazeApiKey:
      process.env.BRAZE_API_KEY || 'BrazeContentProxy/Dev/BRAZE_API_KEY',
  },
  // The URL to query data from.
  clientApi: {
    uri: `https://client-api.getpocket.${
      process.env.NODE_ENV === 'production' ? 'com' : 'dev'
    }`,
  },
  // Params we call Pocket Image Cache with to resize story thumbnails on the fly.
  images: {
    protocol: 'https',
    host: 'pocket-image-cache.com',
    width: 150,
    height: 150,
    filters: 'format(jpeg):quality(100):no_upscale():strip_exif()',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
