import fetch from 'node-fetch';

const headers = {
  'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN,
};

// Port that the lambda secrets layer is running on.
const port = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? 2773;

const inMemoryCache = {};

/**
 * Requests and parses a secret from the Lambda Layer extension
 * @param secretName 
 * @returns the secret
 */
export const fetchSecret = async (
  secretName: string,
): Promise<Record<string, string>> => {
  if (inMemoryCache[secretName]) {
    return inMemoryCache;
  }

  const secretExtensionEndpoint: string = `http://localhost:${port}/secretsmanager/get?secretId=${secretName}`;

  const secret = await fetch(secretExtensionEndpoint, { headers });
  const parsedSecret = await secret.json();
  inMemoryCache[secretName] = parsedSecret;
  return parsedSecret;
};
