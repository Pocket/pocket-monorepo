import { KinesisClient } from '@aws-sdk/client-kinesis';
import config from '../config';

export default new KinesisClient({
  endpoint: config.aws.endpoint, // whether to use localstack
  region: config.aws.region,
  maxAttempts: config.aws.maxRetries,
});
