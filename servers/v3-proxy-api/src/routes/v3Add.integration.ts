import { GraphQLClient } from 'graphql-request';
import request from 'supertest';
import { app, server } from '../main';
import { setTimeout } from 'timers/promises';
import { mockGraphAddResponses } from '../test/fixtures/add';

describe('v3Add', () => {
  const now = 1709600486000;
  beforeAll(() => {
    jest.spyOn(Date.prototype, 'getTime').mockImplementation(() => now);
  });
  afterAll(async () => {
    server.close();
    // Make sure it closes
    await setTimeout(100);
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  describe('with tags', () => {
    let tagRequestSpy;
    beforeAll(() => {
      tagRequestSpy = jest
        .spyOn(GraphQLClient.prototype, 'request')
        .mockResolvedValueOnce({ upsertSavedItem: { id: '1234' } })
        .mockResolvedValueOnce({
          createSavedItemTags: [mockGraphAddResponses[0]],
        });
    });
    afterEach(() => tagRequestSpy.mockClear());
    it('includes tags if tags are in request', async () => {
      await request(app).post('/v3/add').send({
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
    });
    it('throws error if tags array is empty', async () => {
      const result = await request(app).post('/v3/add').send({
        consumer_key: 'test',
        access_token: 'test',
        url: 'https://isithalloween.com',
        tags: '',
      });
      expect(result.status).toEqual(400);
      expect(tagRequestSpy).not.toHaveBeenCalled();
    });
    it.each(['abc,', 'abc,,def', ',abc,123'])(
      'throws error if there is an empty tag string',
      async (tags) => {
        const result = await request(app).post('/v3/add').send({
          consumer_key: 'test',
          access_token: 'test',
          url: 'https://isithalloween.com',
          tags,
        });
        expect(result.status).toEqual(400);
        expect(tagRequestSpy).not.toHaveBeenCalled();
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
      await request(app).post('/v3/add').send({
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
    });
    it('includes title in the args, if passed', async () => {
      await request(app).post('/v3/add').send({
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
    });
  });
});
