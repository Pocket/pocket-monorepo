import { expect } from 'chai';
import { app } from '../main';
import request from 'supertest';
import config from '../config';
import { stories } from './scheduledItems';

describe('/scheduled-items/:scheduledSurfaceID?date=date&apikey=apikey', () => {
  const requestAgent = request.agent(app);

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
    const response = await requestAgent.get(validUrl);

    expect(response.statusCode).equals(200);
    // checking if the cache-control header has been set correctly
    expect(response.headers['cache-control']).to.not.be.undefined;
    expect(response.headers['cache-control']).to.equal('public, max-age=120');
  });

  it('should return correct data when valid query params are provided', async () => {
    // spying on the getStories function to make it return a mock response
    jest.spyOn(stories, 'getStories').mockResolvedValue(testStories as any);

    const response = await requestAgent.get(validUrl);

    expect(response.statusCode).equals(200);
    expect(response.body).to.deep.equal(testStories);
  });

  it('should return 404 for non-existent url ', async () => {
    const response = await requestAgent.get('/not-found');

    expect(response.statusCode).equals(404);
  });

  it('should return 500 if incorrect date format is provided ', async () => {
    const response = await requestAgent.get(
      `/scheduled-items/${testNewTab}?date=20220524`,
    );

    expect(response.statusCode).equals(500);
    expect(response.body.error).to.not.be.undefined;
    expect(response.body.error).to.equal(
      'Not a valid date. Please provide a date in YYYY-MM-DD format.',
    );
  });

  it('should return 500 if invalid api key is provided ', async () => {
    const response = await requestAgent.get(
      `/scheduled-items/${testNewTab}?date=${testDate}&apikey=invalid-key`,
    );

    expect(response.statusCode).equals(500);
    expect(response.body.error).to.not.be.undefined;
    expect(response.body.error).to.equal(
      config.app.INVALID_API_KEY_ERROR_MESSAGE,
    );
  });
});
