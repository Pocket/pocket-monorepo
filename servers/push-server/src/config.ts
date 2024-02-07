import { ServiceAccount } from 'firebase-admin';

const getEnv = (name: string): string => {
  const val = process.env[name];

  if (typeof val === 'undefined') {
    throw `Undefined config ${name}`;
  }

  return val;
};

export const serviceAccount: ServiceAccount = {
  projectId: getEnv('GCM_PROJECT_ID'),
  clientEmail: getEnv('GCM_CLIENT_EMAIL'),
  privateKey: getEnv('GCM_PRIVATE_KEY'),
};

export const sentryDsn = getEnv('SENTRY_DSN');
export const numWorkers = parseInt(getEnv('NUMBER_OF_WORKERS'), 10);
export const msBetweenStarts =
  parseInt(getEnv('TIME_BETWEEN_RESTARTS'), 10) * 1000;
export const apns = {
  token: {
    key: getEnv('APNS_P8_KEY'),
    keyId: getEnv('APNS_KEY_ID'),
    teamId: getEnv('APNS_TEAM_ID'),
  },
  betaBundleId: getEnv('APNS_BETA_BUNDLE_ID'),
  prodBundleId: getEnv('APNS_PROD_BUNDLE_ID'),
};
