import fetch from 'node-fetch';

/**
 * Requests and parses a secret from the Lambda Layer extension
 * @param secretName
 * @returns the secret
 */
export const fetchSecret = async (
  secretName: string,
): Promise<Record<string, string>> => {
  const secretExtensionEndpoint: string = `/secretsmanager/get?secretId=${encodeURIComponent(secretName)}`;
  const secret = await fetchFromLambda(secretExtensionEndpoint);
  return secret.SecretString;
};

/**
 * Requests and parses a parameter from the Lambda Layer extension
 * @param parameterName
 * @returns the parameter
 */
export const fetchParameter = async (
  parameterName: string,
): Promise<string> => {
  const secretExtensionEndpoint: string = `/systemsmanager/parameters/get/?name=${encodeURIComponent(parameterName)}`;
  const secret = await fetchFromLambda(secretExtensionEndpoint);
  return secret.Parameter.Value;
};

const fetchFromLambda = async (url: string): Promise<Record<string, any>> => {
  if (
    !process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_SESSION_TOKEN == 'undefined'
  ) {
    throw new Error(`No AWS_SESSION_TOKEN to access the lambda secret layer`);
  }

  // Port that the lambda secrets layer is running on.
  const port = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? 2773;

  // Grabs a secret according to https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html from the lambda layer
  // https://aws.amazon.com/blogs/compute/using-the-aws-parameter-and-secrets-lambda-extension-to-cache-parameters-and-secrets/
  const secret = await fetch(`http://localhost:${port}${url}`, {
    headers: {
      'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN,
    },
  });
  if (!secret.ok) {
    throw new Error(`Failed fetching ${url} from lambda secret layer`);
  }
  return await secret.json();
};
