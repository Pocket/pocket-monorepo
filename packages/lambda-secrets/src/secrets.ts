const debug = process.env.PARAMETERS_SECRETS_EXTENSION_LOG_LEVEL === 'debug';
import fetchRetry from 'fetch-retry';
export const fetchWithBackoff = fetchRetry(fetch);

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
  // Secret string is itself a JSON string that needs to be decoded
  return JSON.parse(secret.SecretString);
};

/**
 * Requests and parses a parameter from the Lambda Layer extension
 * @param parameterName
 * @returns the parameter
 */
export const fetchParameter = async (
  parameterName: string,
): Promise<string> => {
  const secretExtensionEndpoint: string = `/systemsmanager/parameters/get?name=${encodeURIComponent(parameterName)}`;
  const secret = await fetchFromLambda(secretExtensionEndpoint);
  return secret.Parameter.Value;
};

const fetchFromLambda = async (url: string): Promise<Record<string, any>> => {
  if (
    !process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_SESSION_TOKEN === 'undefined'
  ) {
    throw new Error(`No AWS_SESSION_TOKEN to access the lambda secret layer`);
  }

  // Port that the lambda secrets layer is running on.
  const port = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? 2773;

  // Grabs a secret according to https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html from the lambda layer
  // https://aws.amazon.com/blogs/compute/using-the-aws-parameter-and-secrets-lambda-extension-to-cache-parameters-and-secrets/
  try {
    const secret = await fetchWithBackoff(`http://localhost:${port}${url}`, {
      retryOn: [500, 502, 503],
      retries: 3,
      retryDelay: 1000,
      method: 'GET',
      headers: {
        'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN,
      },
    });
    if (debug) {
      console.info(`Layer response status`, {
        status: secret.status,
        headers: secret.headers,
      });
    }
    if (secret.status !== 200) {
      throw new Error(`Failed fetching ${url} from lambda secret layer`);
    }

    // endpoint does not return json headers, so we grab the text and then parse it.
    return JSON.parse(await secret.text());
  } catch (err) {
    console.error(err);
    throw err;
  }
};
