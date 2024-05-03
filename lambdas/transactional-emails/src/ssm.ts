import { GetParameterCommand, SSM } from '@aws-sdk/client-ssm';
import { config } from './config.js';

const client = new SSM({ region: config.aws.region });

const brazeApiKey: string = null;

export async function getBrazeApiKey() {
  if (brazeApiKey) return brazeApiKey;

  const command = new GetParameterCommand({
    Name: config.aws.ssm.brazeApiKey,
    WithDecryption: true,
  });

  const response = await client.send(command);

  return response.Parameter.Value;
}
