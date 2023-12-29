import { URLSearchParams } from 'url';
import { ParserAPI } from './parserApi';

describe('Parser API unit tests', () => {
  it('should remove `refresh` from the query params for cache key', () => {
    const params = new URLSearchParams([
      ['refresh', 'true'],
      ['image', '0'],
      ['query', 'first'],
      ['page', '1'],
    ]);
    const expected = ParserAPI.baseUrl + 'image=0&page=1&query=first';
    expect(ParserAPI.cacheKeyFor(params)).toEqual(expected);
  });
  it('should sort params for a stable cache key', () => {
    const params = new URLSearchParams([
      ['image', '0'],
      ['query', 'first'],
      ['page', '1'],
    ]);
    const moreParams = new URLSearchParams([
      ['query', 'first'],
      ['page', '1'],
      ['image', '0'],
    ]);
    expect(ParserAPI.cacheKeyFor(params)).toEqual(
      ParserAPI.cacheKeyFor(moreParams),
    );
  });
  it('should throw error if initialized without a cache', () => {
    const parserApi = new ParserAPI();
    expect(() => parserApi.initialize({ context: {}, cache: null })).toThrow(
      'ParserApi requires shared server cache, but found none; check Apollo server cache configuration.',
    );
  });
});
