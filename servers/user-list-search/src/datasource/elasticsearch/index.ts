import elasticsearch from 'elasticsearch';
import { config } from '../../config';

const getHost = (host: string): string => {
  // Setting the host using terraform does not add a protocol to the host
  // We want to check if the set env var for ELASTICSEACH_HOST has a
  // protocol and if it doesn't, preprend https.
  return host.indexOf('http') > -1 ? host : `https://${host}`;
};

/**
 * Elasticsearch client
 */
export const client = new elasticsearch.Client({
  host: getHost(config.aws.elasticsearch.host),
  log: 'info',
  apiVersion: config.aws.elasticsearch.apiVersion,
});
