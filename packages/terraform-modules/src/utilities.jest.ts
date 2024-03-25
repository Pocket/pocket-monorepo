import { getRootDomain, truncateString } from './utilities.js';

describe('utilities', () => {
  describe('getRootDomain()', () => {
    it('gets root domain when root is the domain', () => {
      expect(getRootDomain('getpocket.com')).toBe('getpocket.com');
    });

    it('gets root domain when root has a subdomain', () => {
      expect(getRootDomain('feature.getpocket.com')).toBe('getpocket.com');
    });

    it('gets root domain when root has multiple subdomains', () => {
      expect(getRootDomain('test.feature.getpocket.com')).toBe('getpocket.com');
    });

    it('gets root domain when domain is www', () => {
      expect(getRootDomain('www.getpocket.com')).toBe('getpocket.com');
    });
  });

  describe('truncateString()', () => {
    it('truncates more then 6', () => {
      expect(truncateString('getpocket.com', 6)).toBe('getpoc');
    });

    it('ignores less then 6', () => {
      expect(truncateString('get', 6)).toBe('get');
    });
  });
});
