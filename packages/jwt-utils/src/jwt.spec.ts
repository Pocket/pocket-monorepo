import { generateJwt, PocketJWK } from './jwt.ts';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { dummyJWK } from './index.ts';

describe('jwt test', function () {
  const testPrivateKey: PocketJWK = dummyJWK;

  const testPublicKey = {
    kty: 'RSA',
    e: 'AQAB',
    use: 'sig',
    kid: 'helloworld',
    alg: 'RS256',
    n: 'm6XkeQIGIK44RK44g__-UwzW2cApDNy1H2dCnisrYmJj8QuyEBcFQs9y8PZtYTV3u1fm9awVs-E_SNqy62I6IaTaDwABetjQSNV1-q0NgwpBjcvwldNc2gyt9NNvxE5Yto5RKolZejkAU4GcPgNXah3fgoGZ59IJLVLDl9y9dnYtQwhHZ08k0RqsWTtQTUU9DFN6N7c9d0mOMCet8HbvcTYpT7zcRjAwplpvmo2TAN3iiNRlalyGrxNx2NECewsrDz7oiCutppWUWSa0oIJc0xRGegx4zOMEyPd72Z2Q6-JcxCKjcAIRknOhGyp3pMZZT3lTuoSYK0kbDDFlv90JsQ',
  };

  const now = new Date('2021-01-01 10:20:30');
  const exp = new Date('2021-01-01 10:30:30');

  beforeAll(() => {
    jest.useFakeTimers({
      now: now,
      advanceTimers: false,
    });
  });

  afterAll(() => jest.useRealTimers());

  it('should generate jwt from given private key', () => {
    const token = generateJwt(testPrivateKey, {
      sub: '1',
      issuer: 'fxa-webhook-proxy',
      aud: 'https://client-api.getpocket.com/',
      applicationName: 'FxA',
      apiId: '1',
    });
    const result = jwt.verify(token, jwkToPem(testPublicKey as jwkToPem.RSA), {
      complete: true,
    }) as jwt.Jwt;
    const payload = result.payload as jwt.JwtPayload;
    expect(payload.sub).toEqual('1');
    expect(payload.iss).toEqual('fxa-webhook-proxy');
    expect(payload.aud).toEqual('https://client-api.getpocket.com/');
    expect(payload.iat).toEqual(now.getTime() / 1000);
    expect(payload.exp).toEqual(exp.getTime() / 1000);
    // Required by client-api for disambiguation
    expect(result.header.kid).toEqual('helloworld');
  });
});
