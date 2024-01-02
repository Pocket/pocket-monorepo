import { FetchHandler } from './FetchHandler';
import nock from 'nock';
import { serverLogger } from '../logger';

describe('FetchHandler', () => {
  const serverLoggerErrorSpy = jest.spyOn(serverLogger, 'error');

  beforeAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
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
    afterEach(() => nock.cleanAll());
    afterAll(() => {
      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('does not throw abort error, but logs', async () => {
      expect.assertions(4);
      jest.useFakeTimers();

      const expected = { key: 'value', anotherKey: 'anotherValue' };
      nock('https://get.com/json').get('/example').reply(200, expected);
      const res = new FetchHandler().fetchJSON('https://get.com/json/example');
      jest.advanceTimersByTime(5100);
      const data = await res;
      expect(data).toBeNull();

      expect(serverLoggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(serverLoggerErrorSpy.mock.calls[0][0]).toMatchObject({
        data: { url: 'https://get.com/json/example' },
        error: { message: 'The user aborted a request.', type: 'aborted' },
        level: 'error',
        message: 'invokeFetch: Fetch Request Aborted',
      });
      expect(serverLoggerErrorSpy).not.toThrow();
    });
    it.todo(
      'logs breadcrumb to Sentry and Logger if error encountered on fetch call ',
    );
    it.todo(
      'logs breadcrumb to Sentry and Logger if error encountered on JSON request',
    );
  });
});
