import jwt from 'jsonwebtoken';
import type jwkToBuffer from 'jwk-to-pem';
import jwkToPem from 'jwk-to-pem';

type JwtPayload = {
  iss: string;
  aud: string;
  iat: number; //timestamp
  exp: number;
  sub?: string;
  api_id?: string;
  application_name?: string;
};

export type PocketJWK = jwkToBuffer.JWK & {
  kid: string;
  use: 'sig';
  alg: 'RS256';
};

/**
 * Generates jwt token from the given private key.
 * @param privateKey
 * @param options The options to request user data on
 * https://www.npmjs.com/package/jsonwebtoken
 */
export const generateJwt = (
  privateKey: PocketJWK,
  options: {
    sub?: string;
    issuer: string;
    aud: string;
    apiId: string;
    applicationName: string;
    extraOptions?: Record<string, string>;
  },
) => {
  const now = Math.round(Date.now() / 1000);

  const payload: JwtPayload = {
    iss: options.issuer,
    aud: options.aud,
    iat: now,
    exp: now + 60 * 10, //expires in 10 mins
    sub: options.sub ?? undefined,
    api_id: options.apiId,
    application_name: options.applicationName,
    ...options.extraOptions,
  };

  return jwt.sign(payload, jwkToPem(privateKey, { private: true }), {
    algorithm: 'RS256',
    // Required by client-api to disambiguate from other key(s)
    keyid: privateKey.kid,
  });
};
