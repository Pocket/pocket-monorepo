import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import config from './config';

const client = new SecretsManagerClient({ region: config.aws.region });

//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html
export async function getFxaPrivateKey() {
  try {
    const secret = await client.send(
      new GetSecretValueCommand({
        SecretId: config.jwt.key,
      })
    );

    const privateKey = secret.SecretString as string;
    return JSON.parse(privateKey);
  } catch (e) {
    throw new Error('unable to fetch private key' + e);
  }
}
