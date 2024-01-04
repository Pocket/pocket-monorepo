import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import config from './config';

type JwtPayload = {
  iss: string;
  aud: string;
  iat: number; //timestamp
  exp: number;
  sub: string;
  api_id?: string;
};

/**
 * Generates jwt token from the given private key.
 * @param privateKey
 * @param fxaId
 * https://www.npmjs.com/package/jsonwebtoken
 */
export function generateJwt(privateKey, fxaId: string) {
  const now = Math.round(Date.now() / 1000);

  const payload: JwtPayload = {
    iss: config.jwt.iss,
    aud: config.jwt.aud,
    iat: now,
    exp: now + 60 * 10, //expires in 10 mins
    sub: fxaId,
    api_id: config.app.apiId,
  };

  return jwt.sign(payload, jwkToPem(privateKey, { private: true }), {
    algorithm: 'RS256',
    // Required by client-api to disambiguate from other key(s)
    keyid: privateKey.kid,
  });
}
