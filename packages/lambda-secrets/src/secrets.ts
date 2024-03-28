import fetch from 'node-fetch';

/**
 * Requests and parses a secret from the Lambda Layer extension
 * @param secretName
 * @returns the secret
 */
export const fetchSecret = async (
  secretName: string,
): Promise<Record<string, string>> => {
  if (
    !process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_SESSION_TOKEN == 'undefined'
  ) {
    throw new Error(`No AWS_SESSION_TOKEN to access the secret layer`);
  }

  // Port that the lambda secrets layer is running on.
  const port = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? 2773;
  const secretExtensionEndpoint: string = `http://localhost:${port}/secretsmanager/get?secretId=${secretName}`;

  // Grabs a secret according to https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html from the lambda layer
  const secret = await fetch(secretExtensionEndpoint, {
    headers: {
      'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN,
    },
  });
  if (!secret.ok) {
    throw new Error(`Failed fetching secret ${secretName} from lambda layer`);
  }
  return (await secret.json()).SecretString;
};
