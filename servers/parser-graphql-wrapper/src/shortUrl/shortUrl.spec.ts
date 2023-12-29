import { getShortCodeForId, getShortUrl, shareUrl } from './shortUrl';
import config from '../config';

describe('ShortUrl', () => {
  let sharedRepo;
  beforeAll(async () => {
    jest
      .spyOn(shareUrl, 'fetchShareUrlId')
      .mockReturnValue(Promise.resolve(123));
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('getShortCodeForId', () => {
    expect(getShortCodeForId(123)).toBe('eo');
  });

  it('shortUrl returns short url for given http url', async () => {
    const shortUrl = await getShortUrl(
      123,
      123,
      'http://www.google.com',
      sharedRepo,
    );
    expect(shortUrl).toBe(`https://${config.shortUrl.short_prefix}eo`);
  });

  it('shortUrl returns short url for given https url', async () => {
    const shortUrl = await getShortUrl(
      123,
      123,
      'https://www.google.com',
      sharedRepo,
    );
    expect(shortUrl).toBe(`https://${config.shortUrl.short_prefix_secure}eo`);
  });
});
