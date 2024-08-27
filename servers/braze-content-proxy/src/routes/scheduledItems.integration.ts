import request from 'supertest';
import { Server } from 'http';
import { Application } from 'express';
import config from '../config';
import { stories } from './scheduledItems';
import { startServer } from '../server';

describe('/scheduled-items/:scheduledSurfaceID?date=date&apikey=apikey', () => {
  let app: Application;
  let server: Server;
  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
  });

  const testNewTab = 'POCKET_HITS_EN_US';
  const testDate = '2050-01-01';
  const validUrl = `/scheduled-items/${testNewTab}?date=${testDate}&apikey=${config.aws.brazeApiKey}`;

  const testStories = {
    stories: [
      {
        id: '123-abc',
        url: 'www.test-url.com',
        shortUrl: 'https://pocket.co/abc',
        title: 'test-title',
        excerpt: 'test-excerpt',
        imageUrl: 'www.test-image-url.com',
        authors: 'test-author',
        publisher: 'test-publisher',
        topic: 'health and fitness',
      },
      {
        id: '456-cde',
        url: 'www.second-test-url.com',
        shortUrl: 'https://pocket.co/cde',
        title: 'second-test-title',
        excerpt: 'second-test-excerpt',
        imageUrl: 'www.second-test-image-url.com',
        authors: 'second-test-author',
        publisher: 'second-test-publisher',
        topic: 'entertainment',
      },
    ],
  };

  it('should return 200 OK and correct headers when valid query params are provided', async () => {
    const response = await request(app).get(validUrl);

    expect(response.statusCode).toBe(200);
    // checking if the cache-control header has been set correctly
    expect(response.headers['cache-control']).not.toBeUndefined();
    expect(response.headers['cache-control']).toBe('public, max-age=120');
  });

  it('should return correct data when valid query params are provided', async () => {
    // spying on the getStories function to make it return a mock response
    jest.spyOn(stories, 'getStories').mockResolvedValue(testStories as any);

    const response = await request(app).get(validUrl);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(testStories);
  });

  it('should return 404 for non-existent url ', async () => {
    const response = await request(app).get('/not-found');

    expect(response.statusCode).toBe(404);
  });

  it('should return 500 if incorrect date format is provided ', async () => {
    const response = await request(app).get(
      `/scheduled-items/${testNewTab}?date=20220524`,
    );

    expect(response.statusCode).toBe(500);
    expect(response.body.error).not.toBeUndefined();
    expect(response.body.error).toBe(
      'Not a valid date. Please provide a date in YYYY-MM-DD format.',
    );
  });

  it('should return 500 if invalid api key is provided ', async () => {
    const response = await request(app).get(
      `/scheduled-items/${testNewTab}?date=${testDate}&apikey=invalid-key`,
    );

    expect(response.statusCode).toBe(500);
    expect(response.body.error).not.toBeUndefined();
    expect(response.body.error).toBe(config.app.INVALID_API_KEY_ERROR_MESSAGE);
  });
});
