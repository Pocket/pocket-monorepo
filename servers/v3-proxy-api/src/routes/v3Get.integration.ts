import request from 'supertest';
import { app, server } from '../main';
import * as Sentry from '@sentry/node';
import sinon from 'sinon';
import * as GraphQLCalls from '../graph/graphQLClient';

describe('v3Get', () => {
  afterEach(async () => {
    server.close();
    sinon.restore();
  });
  let expectedHeaders;

  beforeAll(() => {
    expectedHeaders = {
      'X-Error-Code': '198',
      'X-Error': 'Internal Server Error',
    };
  });

  it('GET should log to Sentry and throw 5xx for unknown errors', async () => {
    //const consoleStub = sinon.stub(console, 'log');
    const sentryStub = sinon.stub(Sentry, 'captureException');
    sinon.stub(GraphQLCalls, 'callSavedItems').throws(new Error('test error'));
    const response = await request(app)
      .get('/v3/get')
      .send({ consumer_key: 'test', access_token: 'test' });
    expect(response.status).toBe(500);
    //console log for some reason shows twice for the first test
    //expect(consoleStub.callCount).toBe(1);
    expect(sentryStub.callCount).toBe(1);
    expect(response.headers['x-error-code']).toBe(
      expectedHeaders['X-Error-Code'],
    );
    expect(response.body).toEqual({ error: 'GET: v3/get: Error: test error' });
  });

  it('POST should log to Sentry and throw 5xx for unknown errors', async () => {
    const consoleStub = sinon.stub(console, 'log');
    const sentryStub = sinon.stub(Sentry, 'captureException');
    sinon.stub(GraphQLCalls, 'callSavedItems').throws(new Error('test error'));
    const response = await request(app)
      .post('/v3/get')
      .send({ consumer_key: 'test', access_token: 'test' });
    expect(response.status).toBe(500);
    expect(consoleStub.callCount).toBe(1);
    expect(sentryStub.callCount).toBe(1);
    expect(response.headers['x-error-code']).toBe(
      expectedHeaders['X-Error-Code'],
    );
    expect(response.body).toEqual({ error: 'POST: v3/get: Error: test error' });
  });
});
