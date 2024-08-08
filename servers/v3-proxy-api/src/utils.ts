import config from './config';

/**
 * Parse the API ID (prefix) from the consumer key string.
 * We don't need to do a ton of validation because this is
 * just used to determine if the request comes from an extension
 * and whether we need to return special responses; if people pass
 * weird stuff in the consumer keys it will just be ignored.
 * @param consumerKey consumer key provided to API by Pocket;
 * format is prefixed by "<api_id>-"
 */
export function parseApiId(consumerKey: string): number | undefined {
  const re = new RegExp(/^(\d+)-[\w\d]+/);
  const apiId = consumerKey.match(re)?.[0];
  return apiId != null ? parseInt(apiId) : undefined;
}

export function isExtension(apiId: number | undefined) {
  return config.extensionApiIds.indexOf(apiId) >= 0 ? true : false;
}
