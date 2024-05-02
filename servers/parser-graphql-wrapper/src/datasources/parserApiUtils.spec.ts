import { ParserResponse } from './ParserAPITypes.js';
import { extractDomainMeta, normalizeDate } from './parserApiUtils.js';

describe('normalizeDate', () => {
  it('catches 0000 empty date', () => {
    expect(normalizeDate('0000-00-00 00:00:00')).toBe(null);
  });

  it('catches whitespace empty date', () => {
    expect(normalizeDate('  ')).toBe(null);
  });

  it('passes non-empty potentially legit date through', () => {
    expect(normalizeDate('good faith')).toBe('good faith');
  });
});

describe('extractDomainMeta', () => {
  it('gets an empty domainMeta object', () => {
    expect(extractDomainMeta({} as ParserResponse)).toEqual({});
  });

  it('infers domain from given url', () => {
    expect(
      extractDomainMeta({
        given_url: 'http://getpocket.com',
      } as ParserResponse),
    ).toMatchObject({
      name: 'getpocket.com',
    });
  });

  it('passes through existing domain metadata', () => {
    expect(
      extractDomainMeta({
        domainMetadata: { name: 'domain', logo: 'http' },
      } as ParserResponse),
    ).toMatchObject({ name: 'domain', logo: 'http' });
  });
});
