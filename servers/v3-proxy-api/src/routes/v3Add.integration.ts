import { GraphQLClient } from 'graphql-request';
import request from 'supertest';
import { mockGraphAddResponses } from '../test/fixtures/add';
import { Application } from 'express';
import { Server } from 'http';
import { startServer } from '../server';

describe('v3Add', () => {
  let app: Application;
  let server: Server;

  const expectedHeaders = {
    'X-Source': 'Pocket',
  };
  const now = 1709600486000;
  beforeAll(async () => {
    jest.spyOn(Date.prototype, 'getTime').mockImplementation(() => now);
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  describe('with tags', () => {
    let tagRequestSpy;
    beforeEach(() => {
      tagRequestSpy = jest
        .spyOn(GraphQLClient.prototype, 'request')
        .mockResolvedValueOnce({ upsertSavedItem: { id: '1234' } })
        .mockResolvedValueOnce({
          createSavedItemTags: [mockGraphAddResponses[0]],
        });
    });
    afterEach(() => tagRequestSpy.mockClear());
    it('includes tags if tags are in request', async () => {
      const response = await request(app).post('/v3/add').send({
        consumer_key: 'test',
        access_token: 'test',
        url: 'https://isithalloween.com',
        tags: 'abc,123',
      });
      expect(tagRequestSpy).toHaveBeenCalledTimes(2);
      // Struggling with a matcher for toHaveBeenLastCalledWith... the call signature is nasty
      // on these functions
      expect(tagRequestSpy.mock.calls[1].length).toEqual(2);
      expect((tagRequestSpy.mock.calls[1] as any)[1]).toEqual({
        tags: { savedItemId: '1234', tags: ['abc', '123'] },
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('accepts array of tags', async () => {
      const response = await request(app)
        .post('/v3/add')
        .send({
          consumer_key: 'test',
          access_token: 'test',
          url: 'https://isithalloween.com',
          tags: ['abc', '123'],
        });
      expect(tagRequestSpy).toHaveBeenCalledTimes(2);
      // Struggling with a matcher for toHaveBeenLastCalledWith... the call signature is nasty
      // on these functions
      expect(tagRequestSpy.mock.calls[1].length).toEqual(2);
      expect((tagRequestSpy.mock.calls[1] as any)[1]).toEqual({
        tags: { savedItemId: '1234', tags: ['abc', '123'] },
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('throws error if tags array is empty', async () => {
      const response = await request(app).post('/v3/add').send({
        consumer_key: 'test',
        access_token: 'test',
        url: 'https://isithalloween.com',
        tags: '',
      });
      expect(response.status).toEqual(400);
      expect(tagRequestSpy).not.toHaveBeenCalled();
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it.each(['abc,', 'abc,,def', ',abc,123', ['abc', '']])(
      'throws error if there is an empty tag string',
      async (tags) => {
        const response = await request(app).post('/v3/add').send({
          consumer_key: 'test',
          access_token: 'test',
          url: 'https://isithalloween.com',
          tags,
        });
        expect(response.status).toEqual(400);
        expect(tagRequestSpy).not.toHaveBeenCalled();
        expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
      },
    );
  });
  describe('without tags', () => {
    let requestSpy;
    beforeAll(() => {
      requestSpy = jest
        .spyOn(GraphQLClient.prototype, 'request')
        .mockResolvedValue({
          upsertSavedItem: mockGraphAddResponses[0],
        });
    });
    afterEach(() => requestSpy.mockClear());
    it('calls upsert once, without tags', async () => {
      const response = await request(app).post('/v3/add').send({
        consumer_key: 'test',
        access_token: 'test',
        url: 'https://isithalloween.com',
      });
      expect(requestSpy).toHaveBeenCalledTimes(1);
      // Struggling with a matcher for toHaveBeenCalledWith... the call signature is nasty
      // on these functions
      expect(requestSpy.mock.calls[0].length).toEqual(2);
      expect((requestSpy.mock.calls[0] as any)[1]).toEqual({
        input: { timestamp: now / 1000, url: 'https://isithalloween.com' },
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
    it('includes title in the args, if passed', async () => {
      const response = await request(app).post('/v3/add').send({
        consumer_key: 'test',
        access_token: 'test',
        url: 'https://isithalloween.com',
        title: 'is it halloween?',
      });
      expect(requestSpy).toHaveBeenCalledTimes(1);
      // Struggling with a matcher for toHaveBeenCalledWith... the call signature is nasty
      // on these functions
      expect(requestSpy.mock.calls[0].length).toEqual(2);
      expect((requestSpy.mock.calls[0] as any)[1]).toEqual({
        input: {
          timestamp: now / 1000,
          url: 'https://isithalloween.com',
          title: 'is it halloween?',
        },
      });
      expect(response.headers['x-source']).toBe(expectedHeaders['X-Source']);
    });
  });
});
