import { expect } from 'chai';
import { extractDomainMeta, normalizeDate } from './parserApiUtils';

describe('normalizeDate', () => {
  it('catches 0000 empty date', () => {
    expect(normalizeDate('0000-00-00 00:00:00')).to.be.equal(null);
  });

  it('catches whitespace empty date', () => {
    expect(normalizeDate('  ')).to.be.equal(null);
  });

  it('passes non-empty potentially legit date through', () => {
    expect(normalizeDate('good faith')).to.be.equal('good faith');
  });
});

describe('extractDomainMeta', () => {
  it('gets an empty domainMeta object', () => {
    expect(extractDomainMeta({})).to.deep.equal({});
  });

  it('infers domain from normalized url', () => {
    expect(
      extractDomainMeta({ normal_url: 'http://getpocket.com' }),
    ).to.include({
      name: 'getpocket.com',
    });
  });

  it('passes through existing domain metadata', () => {
    expect(
      extractDomainMeta({ domain_metadata: { name: 'domain', logo: 'http' } }),
    ).to.include({ name: 'domain', logo: 'http' });
  });
});
