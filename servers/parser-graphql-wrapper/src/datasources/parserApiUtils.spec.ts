import { extractDomainMeta, normalizeDate } from './parserApiUtils';

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
    expect(extractDomainMeta({})).toEqual({});
  });

  it('infers domain from normalized url', () => {
    expect(
      extractDomainMeta({ normal_url: 'http://getpocket.com' }),
    ).toMatchObject({
      name: 'getpocket.com',
    });
  });

  it('passes through existing domain metadata', () => {
    expect(
      extractDomainMeta({ domain_metadata: { name: 'domain', logo: 'http' } }),
    ).toMatchObject({ name: 'domain', logo: 'http' });
  });
});
