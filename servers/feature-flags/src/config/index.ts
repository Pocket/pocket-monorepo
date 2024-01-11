export default {
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'pkt_featureflags',
    password: process.env.DB_PASSWORD || 'password',
    dbname: process.env.DB_NAME || 'featureflags',
  },
  app: {
    environment: process.env.NODE_ENV || 'development',
    graphqlEndpoint: '/graphql',
    port: 4242,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  isDev: process.env.NODE_ENV === 'development',
  mozillaIAMAccessGroup: 'mozilliansorg_pocket_featureflags',
  oauth: {
    clientId: process.env.CLIENT_ID || 'abc',
    clientSecret: process.env.CLIENT_SECRET || 'def',
    callbackURL:
      process.env.CALLBACK_URL || 'http://localhost:4242/api/auth/callback',
    authorizationURL:
      process.env.AUTH_URL ||
      'https://mozilla-auth-proxy.getpocket.dev/oauth2/authorize',
    tokenURL:
      process.env.TOKEN_URL ||
      'https://mozilla-auth-proxy.getpocket.dev/oauth2/token',
    userInfoURL:
      process.env.USER_INFO_URL ||
      'https://mozilla-auth-proxy.getpocket.dev/oauth2/userInfo',
    issuer:
      process.env.ISSUER_URL ||
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_mRcjJxBAh',
  },
  //We set use auth to false on our local environments
  bypassAuth: process.env.NODE_ENV === 'local',
};
