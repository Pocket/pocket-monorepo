import { expect } from 'chai';
import { getRootDomain, truncateString } from './utilities';

describe('utilities', () => {
  describe('getRootDomain()', () => {
    it('gets root domain when root is the domain', () => {
      expect(getRootDomain('getpocket.com')).to.equal('getpocket.com');
    });

    it('gets root domain when root has a subdomain', () => {
      expect(getRootDomain('feature.getpocket.com')).to.equal('getpocket.com');
    });

    it('gets root domain when root has multiple subdomains', () => {
      expect(getRootDomain('test.feature.getpocket.com')).to.equal(
        'getpocket.com',
      );
    });

    it('gets root domain when domain is www', () => {
      expect(getRootDomain('www.getpocket.com')).to.equal('getpocket.com');
    });
  });

  describe('truncateString()', () => {
    it('truncates more then 6', () => {
      expect(truncateString('getpocket.com', 6)).to.equal('getpoc');
    });

    it('ignores less then 6', () => {
      expect(truncateString('get', 6)).to.equal('get');
    });
  });
});
