import { FetchHandler } from './FetchHandler';
import nock from 'nock';
import sinon from 'sinon';
import { serverLogger } from '../server';

describe('FetchHandler', () => {
  const serverLoggerErrorSpy = sinon.spy(serverLogger, 'error');
  // TODO
  // const sentryExceptionStub = sinon.stub(Sentry, 'captureException');
  // const sentryBreadcrumbStub = sinon.stub(Sentry, 'addBreadcrumb');

  afterEach(() => {
    sinon.resetHistory();
  });
  afterAll(() => {
    sinon.restore();
  });

  it('throws error if response is not ok', async () => {
    expect.assertions(1);
    const message = 'nuh uh uh';
    nock('https://get.com/json').get('/example').reply(503, message);
    try {
      await new FetchHandler().fetchJSON('https://get.com/json/example');
    } catch (error) {
      expect(error.message).toContain(`HTTP Error Response: 503`);
    }
  });
  it('fetches json data', async () => {
    const expected = { key: 'value', anotherKey: 'anotherValue' };
    nock('https://get.com/json').get('/example').reply(200, expected);
    const res = await new FetchHandler().fetchJSON(
      'https://get.com/json/example',
    );
    expect(res).toStrictEqual(expected);
  });
  describe('with abort controller', () => {
    const clock = sinon.useFakeTimers();
    afterEach(() => nock.cleanAll());
    afterAll(() => {
      clock.runAll();
      clock.restore();
    });

    it('does not throw abort error, but logs', async () => {
      expect.assertions(2);

      const expected = { key: 'value', anotherKey: 'anotherValue' };
      nock('https://get.com/json').get('/example').reply(200, expected);
      const res = new FetchHandler().fetchJSON('https://get.com/json/example');
      await clock.tickAsync(5100);
      const data = await res;
      expect(data).toBeNull();
      expect(() =>
        sinon.assert.calledOnceWithMatch(serverLoggerErrorSpy, {
          data: { url: 'https://get.com/json/example' },
          error: { message: 'The user aborted a request.', type: 'aborted' },
          level: 'error',
          message: 'invokeFetch: Fetch Request Aborted',
        }),
      ).not.toThrow();
    });
  });
  it.todo(
    'logs breadcrumb to Sentry and Logger if error encountered on fetch call ',
  );
  it.todo(
    'logs breadcrumb to Sentry and Logger if error encountered on JSON request',
  );
});
