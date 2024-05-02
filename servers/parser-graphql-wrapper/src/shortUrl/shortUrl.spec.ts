import {
  getIdFromShortCode,
  getShortCodeForId,
  getShortUrl,
  shareUrl,
  extractCodeFromShortUrl,
} from './shortUrl.js';
import config from '../config/index.js';

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
    expect(getShortCodeForId(123)).toBe('cb');
  });
  it.each([
    4294967294, 2147483647, 844596301, 844596300, 61, 62, 60, 610000, 609999,
    610001,
  ])('shortCode round trips: %i', (id) => {
    const shortCode = getShortCodeForId(id);
    const idCalc = getIdFromShortCode(shortCode);
    expect(idCalc).toEqual(id);
  });
  it('shortCode round trip - 100 random numbers', () => {
    const max = 2147483647 + 1;
    const min = 1;
    const randBetween = () => Math.floor(Math.random() * (max - min + 1) + min);
    const ids = Array.from(Array(100).keys()).map(randBetween);
    const codes = ids.map((id) => getShortCodeForId(id));
    const idsCalc = codes.map((code) => getIdFromShortCode(code));
    expect(ids).toEqual(idsCalc);
  });
  it('shortUrl returns short url for given http url', async () => {
    const shortUrl = await getShortUrl(
      123,
      123,
      'http://www.google.com',
      sharedRepo,
    );
    expect(shortUrl).toBe(`https://${config.shortUrl.short_prefix}cb`);
  });

  it('shortUrl returns short url for given https url', async () => {
    const shortUrl = await getShortUrl(
      123,
      123,
      'https://www.google.com',
      sharedRepo,
    );
    expect(shortUrl).toBe(`https://${config.shortUrl.short_prefix_secure}cb`);
  });
  it.each([
    {
      // http, short prefix alternative 1
      url: `http://${config.shortUrl.short_prefix}dR32_lr`,
      expected: 'dR32_lr',
    },
    {
      // https, short prefix alternative 2
      url: `https://${config.shortUrl.short_prefix_secure}LSxopD`,
      expected: 'LSxopD',
    },
    // contains character not in charset, partial match (if not considering end of string)
    { url: `${config.shortUrl.short_prefix}z_eE0wEp`, expected: undefined }, // 0 is not in charset
    // contains character not in charset at end of string
    { url: `${config.shortUrl.short_prefix}z_eEwEp-`, expected: undefined },
    // no http, alternative 1
    { url: `${config.shortUrl.short_prefix}z_eE9wEp`, expected: 'z_eE9wEp' },
    // no http, alternative 2
    {
      url: `${config.shortUrl.short_prefix_secure}MBvhI`,
      expected: 'MBvhI',
    },
    // very similar domain (local.com vs. local.co)
    { url: 'http://local.com/aBN2u9', expected: undefined },
    { url: 'http://local.com/bmNwdK', expected: undefined },
  ])('extracts code if the URL is a short URL', ({ url, expected }) => {
    expect(extractCodeFromShortUrl(url)).toEqual(expected);
  });
});
