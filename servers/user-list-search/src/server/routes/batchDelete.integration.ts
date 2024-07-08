import request from 'supertest';
import { startServer } from '../serverUtils';
import * as es from '../../saves/elasticsearch';
import { Application } from 'express';
import { ContextManager } from '../context';
import { ApolloServer } from '@apollo/server';

describe('batchDelete', () => {
  let server: ApolloServer<ContextManager>;
  let app: Application;
  const deleteStub = jest
    .spyOn(es, 'deleteSearchIndexByUserId')
    .mockImplementation(() => Promise.resolve());

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  afterAll(async () => {
    await server.stop();
    jest.clearAllMocks();
  });
  it('accepts request with userId in the payload', async () => {
    const payload = { userId: '123' };
    const res = await request(app).post('/batchDelete').send(payload);
    expect(res.ok).toBeTruthy();
    expect(deleteStub).toHaveBeenCalledTimes(1);
  });
  it('does not work if userId is missing', async () => {
    const payload = {};
    const res = await request(app).post('/batchDelete').send(payload);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
    expect(res.statusCode).toBe(400);
    expect(deleteStub).toHaveBeenCalledTimes(0);
  });
});
