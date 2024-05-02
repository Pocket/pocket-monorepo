import nock, { cleanAll } from 'nock';
import { fetchParameter, fetchSecret } from './secrets.js';

describe('lambda secrets', () => {
  const secretName = 'Lambda/Super/Secret';
  const session = 'super_secret_session';
  const secretValue = {
    SecretString: JSON.stringify({
      secret1: 'pocket',
      secret2: 'is',
      secret3: 'cool',
    }),
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
    expect(secret).toEqual(JSON.parse(secretValue.SecretString));
  });

  it('does fail from lambda endpoint when session not valid', async () => {
    process.env.AWS_SESSION_TOKEN = undefined;
    expect.assertions(1);
    try {
      await fetchSecret(secretName);
    } catch (e) {
      expect(e.message).toBe(
        'No AWS_SESSION_TOKEN to access the lambda secret layer',
      );
    }
  });

  it('does fail from lambda endpoint returns an error', async () => {
    process.env.AWS_SESSION_TOKEN = session;
    expect.assertions(1);
    cleanAll();
    nock(`http://localhost:2773`)
      .get(`/secretsmanager/get?secretId=${encodeURIComponent(secretName)}`)
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    nock(`http://localhost:2773`)
      .get(`/secretsmanager/get?secretId=${encodeURIComponent(secretName)}`)
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    nock(`http://localhost:2773`)
      .get(`/secretsmanager/get?secretId=${encodeURIComponent(secretName)}`)
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    nock(`http://localhost:2773`)
      .get(`/secretsmanager/get?secretId=${encodeURIComponent(secretName)}`)
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    try {
      await fetchSecret(secretName);
    } catch (e) {
      expect(e.message).toBe(
        `Failed fetching /secretsmanager/get?secretId=${encodeURIComponent(secretName)} from lambda secret layer`,
      );
    }
  });
});

describe('lambda parameters', () => {
  const secretName = 'Lambda/Super/Parameter';
  const session = 'super_secret_session';
  const secretValue = {
    Parameter: {
      Value: 'pocket',
    },
    OtherAWSValues: 'blah',
  };

  beforeEach(() => {
    nock(`http://localhost:2773`)
      .get(
        `/systemsmanager/parameters/get?name=${encodeURIComponent(secretName)}`,
      )
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(200, JSON.stringify(secretValue));
  });

  afterEach(() => {
    cleanAll();
  });

  it('does fetch from lambda endpoint', async () => {
    process.env.AWS_SESSION_TOKEN = session;
    const secret = await fetchParameter(secretName);
    expect(secret).toEqual(secretValue.Parameter.Value);
  });

  it('does fail from lambda endpoint when session not valid', async () => {
    process.env.AWS_SESSION_TOKEN = undefined;
    expect.assertions(1);
    try {
      await fetchParameter(secretName);
    } catch (e) {
      expect(e.message).toBe(
        'No AWS_SESSION_TOKEN to access the lambda secret layer',
      );
    }
  });

  it('does fail from lambda endpoint returns an error', async () => {
    process.env.AWS_SESSION_TOKEN = session;
    expect.assertions(1);
    cleanAll();
    nock(`http://localhost:2773`)
      .get(
        `/systemsmanager/parameters/get?name=${encodeURIComponent(secretName)}`,
      )
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    nock(`http://localhost:2773`)
      .get(
        `/systemsmanager/parameters/get?name=${encodeURIComponent(secretName)}`,
      )
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    nock(`http://localhost:2773`)
      .get(
        `/systemsmanager/parameters/get?name=${encodeURIComponent(secretName)}`,
      )
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    nock(`http://localhost:2773`)
      .get(
        `/systemsmanager/parameters/get?name=${encodeURIComponent(secretName)}`,
      )
      .matchHeader('X-Aws-Parameters-Secrets-Token', session)
      .reply(500);
    try {
      await fetchParameter(secretName);
    } catch (e) {
      expect(e.message).toBe(
        `Failed fetching /systemsmanager/parameters/get?name=${encodeURIComponent(secretName)} from lambda secret layer`,
      );
    }
  });
});
