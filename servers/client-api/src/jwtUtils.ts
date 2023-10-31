//Bits and pieces have been taken from https://github.com/Pocket/feature-flags/blob/master/src/jwtAuth.ts as the reference

import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AuthenticationError } from '@pocket-tools/apollo-utils';
import config from './config';
import Sentry from '@sentry/node';
import { serverLogger } from './server/express';

/**
 * Represents a pocket user from getpocket.com jwt token
 * All fields are optional because the getpocket.com may or may not have the info depending on the request made
 */
export interface PocketUser {
  premium?: boolean;
  encodedId?: string;
  roles?: string[];
  consumerKey?: string;
  apiId?: string;
  applicationName?: string;
  applicationIsTrusted?: boolean;
  applicationIsNative?: boolean;
  userId?: string;
  fxaUserId?: string;
  email?: string;
  guid?: string;
  encodedGuid?: string;
}

/**
 * Validates and decodes a JWT into a pocket user
 * If validation fails this will error to the client and not return a response
 * This is expected because if a JWT is passed to use then it needs to validate
 * @param rawJwtToken
 * @param publicKeys
 */
export const validateAndGetPocketUser = async (
  rawJwtToken: string,
  publicKeys: Record<string, string>
): Promise<PocketUser> => {
  // Cast to JwtPayload because jsonwebtoken library updated the types of the payload to be JwtPayload | string.
  // But in our case its always a JwtPayload
  const decoded = decodeDataJwt(rawJwtToken) as jwt.Jwt;
  if (!(decoded.payload as jwt.JwtPayload)?.iss) {
    throw new AuthenticationError(
      'The JWT has no issuer defined, unabled to verify'
    );
  }
  try {
    jwt.verify(
      rawJwtToken,
      publicKeys[decoded.header.kid || config.auth.defaultKid]
    );
  } catch (err) {
    serverLogger.error({
      message: 'Could not validate jwt',
      error: err,
      data: {
        jwt: rawJwtToken,
      },
    });
    if (err instanceof JsonWebTokenError) {
      throw new AuthenticationError(`Could not validate User: ${err.message}`);
    } else if (err instanceof TokenExpiredError) {
      throw new AuthenticationError('Token Expired');
    } else if (err instanceof NotBeforeError) {
      throw new AuthenticationError('Token not yet active');
    } else {
      serverLogger.error({
        message: 'validateAndGetPocketUser:Error with token and/or user.',
        error: err,
        data: {},
      });
      Sentry.captureException(err);
      throw new Error('Internal server error');
    }
  }

  return buildPocketUser(decoded);
};

//Set the SIGNING key ttl to 1 week.
//This currnetly has not updated on getpocket.com for now so a long ttl is ok
const SIGNING_KEY_TTL = 60 * 60 * 24 * 7;

/**
 * Gets the signing key from the issuer server
 * @returns Record of public key string by kid.
 */
export const getSigningKeysFromServer = async (): Promise<
  Record<string, string>
> => {
  // https://getpocket.com/.well-known/jwk
  const jwksUri = `https://${config.auth.jwtIssuer}/.well-known/jwk`;
  const client = jwksClient({
    jwksUri,
    cache: true, // Default Value
    cacheMaxEntries: 5, // Default value
    cacheMaxAge: SIGNING_KEY_TTL,
  });

  const keys = await Promise.all(
    config.auth.kids.map((kid: string) => client.getSigningKeyAsync(kid))
  );

  const publicKeyStringRecords: Record<string, string> = keys.reduce(
    (acc: Record<string, string>, key: jwksClient.SigningKey) => {
      acc[key.kid] = key.getPublicKey();
      return acc;
    },
    {} as Record<string, string>
  );

  Object.values(publicKeyStringRecords).forEach((publicKeyString: string) => {
    if (!publicKeyString) {
      throw new Error(
        'Unable to get the public key from the issuer to verify the JWT'
      );
    }
  });

  return publicKeyStringRecords;
};

/**
 * Decodes a raw JWT string into  Jwt object
 * @throws AuthenticationError if decoded object is null
 * @param rawJwt raw JWT string
 */
const decodeDataJwt = (rawJwt: string): jwt.Jwt => {
  const decoded = jwt.decode(rawJwt, {
    complete: true,
  });

  if (!decoded) {
    throw new AuthenticationError('Could not decode jwt');
  }
  return decoded;
};

/**
 * Given a decoded JWT build out the pocket user
 * @param decoded
 */
const buildPocketUser = (decoded: jwt.Jwt): PocketUser => {
  const payload = decoded.payload as jwt.JwtPayload;
  const kid = decoded.header.kid;
  return {
    // Indicates whether the user is a premium user
    premium: payload.premium,
    // The user identifier
    userId: payload.sub,
    // The FxA user identifier
    // Only set if the JWT comes from the FxA proxy service
    fxaUserId: kid === config.auth.fxaKid ? payload.sub : undefined,
    // The encoded user identifier
    encodedId: payload.encoded_id,
    // The roles assigned to the user
    roles: payload.roles,
    // API key used by applications to access Pocket's API
    consumerKey: payload.consumer_key,
    // An identifier for the the API user. This forms the prefix of the consumer key
    apiId: payload.api_id,
    // The name of the API user ex Android app
    applicationName: payload.application_name,
    // Indicates whether the API user is native i.e. internally assigned within Pocket
    applicationIsNative: payload.application_is_native,
    // Indicates whether the API user is trusted i.e. we are confident actions by this user represents real user actions
    applicationIsTrusted: payload.application_is_trusted,
    // A guid that is used to connect the user's logged out events to logged in events. Primarily used for analytics
    guid: payload.guid,
    // The encoded guid
    encodedGuid: payload.encoded_guid,
    // The user email
    email: payload.email,
  };
};
