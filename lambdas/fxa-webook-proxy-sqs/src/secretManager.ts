import config from './config';
import { fetchSecret } from '@pocket-tools/lambda-secrets';

//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html
export async function getFxaPrivateKey() {
  try {
    return await fetchSecret(config.jwt.key);
  } catch (e) {
    throw new Error('unable to fetch private key' + e);
  }
}
