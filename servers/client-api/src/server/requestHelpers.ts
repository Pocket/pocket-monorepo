import { GatewayGraphQLRequest } from '@apollo/server-gateway-interface';
import { IContext } from './context';
import { PocketUser } from '../jwtUtils';

/**
 * Extract first value from an http header. If array, first
 * element in array. If string, the string.
 */
export function extractHeader(header: string | string[]): string {
  if (header instanceof Array) {
    return header[0];
  } else {
    return header;
  }
}

/**
 * Copy the record values to the passed request object.
 * Mutates the request object inplace.
 */
export function addRecordToRequestHeader(
  record: Record<string, string>,
  request: GatewayGraphQLRequest
): void {
  Object.entries(record).forEach(([key, value]) => {
    if (value) {
      request.http.headers.set(key, value);
    }
  });
}

const copy_user_props_to_headers: string[] = [
  'apiId',
  'applicationIsNative',
  'applicationIsTrusted',
  'applicationName',
  'consumerKey',
  'email',
  'encodedGuid',
  'encodedId',
  'fxaUserId',
  'guid',
  'premium',
  'roles',
  'userId',
];

/**
 * Add pocket user properties to request header
 * The data added here are extracted from the JWT header
 * coming from the web repo.
 * @param request
 * @param user
 */
export function buildRequestHeadersFromPocketUser(
  request: GatewayGraphQLRequest,
  user: PocketUser
): GatewayGraphQLRequest {
  for (const prop of copy_user_props_to_headers) {
    if (
      !(prop in user) ||
      user[prop] === undefined ||
      user[prop] === null ||
      user[prop] === ''
    ) {
      continue;
    }
    switch (prop) {
      case 'guid': // intentional fallthrough
      case 'userId':
        if (isNaN(parseInt(user[prop]))) continue;
      // intentional fallthrough
      default:
        request.http.headers.set(prop, user[prop]);
    }
  }
  return request;
}

/**
 * These are additional request headers sent from the web repo.
 * Subgraphs use these headers coming for the original user
 * request to send accurate request context for analytics.
 * TODO: This will no longer be need once clients are able to make
 * requests directly to this gateway service.
 * @param request
 * @param webRequest
 */
export function buildRequestHeadersFromWebRequest(
  request: GatewayGraphQLRequest,
  webRequest: IContext['webRequest']
): GatewayGraphQLRequest {
  request.http.headers.set('gatewayLanguage', webRequest.language);
  request.http.headers.set('gatewayIpAddress', webRequest.ipAddress);
  request.http.headers.set(
    'gatewaySnowplowDomainUserId',
    webRequest.snowplowDomainUserId
  );
  request.http.headers.set('gatewayUserAgent', webRequest.userAgent);

  return request;
}
