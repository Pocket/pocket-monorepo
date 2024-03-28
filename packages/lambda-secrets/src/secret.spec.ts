import nock, { cleanAll } from 'nock';
import { fetchSecret } from './secrets';

describe('lambda secrets', () => {
  const secretName = 'Lambda/Super/Secret';
  const session = 'super_secret_session';
  const secretValue = {
    SecretString: {
      secret1: 'pocket',
      secret2: 'is',
      secret3: 'cool',
    },
    OtherAWSValues: 'blah',
  };

  beforeEach(() => {
    nock(`http://localhost:2773`)
      .get(`/secretsmanager/get?secretId=${secretName}`)
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(200, JSON.stringify(secretValue));
  });

  afterEach(() => {
    cleanAll();
  });

  it('does fetch from lambda endpoint', async () => {
    process.env.AWS_SESSION_TOKEN = session;
    const secret = await fetchSecret(secretName);
    expect(secret).toEqual(secretValue.SecretString);
  });

  it('does fail from lambda endpoint when session not valid', async () => {
    process.env.AWS_SESSION_TOKEN = undefined;
    expect.assertions(1);
    try {
      await fetchSecret(secretName);
    } catch (e) {
      expect(e.message).toBe('No AWS_SESSION_TOKEN to access the secret layer');
    }
  });

  it('does fail from lambda endpoint returns an error', async () => {
    process.env.AWS_SESSION_TOKEN = session;
    expect.assertions(1);
    cleanAll();
    nock(`http://localhost:2773`)
      .get(`/secretsmanager/get?secretId=${secretName}`)
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    try {
      await fetchSecret(secretName);
    } catch (e) {
      expect(e.message).toBe(
        `Failed fetching secret ${secretName} from lambda layer`,
      );
    }
  });
});
