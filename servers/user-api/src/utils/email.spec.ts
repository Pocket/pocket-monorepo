import { UserInputError } from '@pocket-tools/apollo-utils';
import { contactHash, normalizeEmail } from './email';

describe('Email functions - ', () => {
  describe('normalizeEmail', () => {
    const badInputError = (email: string) =>
      new UserInputError(`Bad email address provided for update: ${email}`);
    it('throws error if domain is missing', () => {
      expect(() => normalizeEmail('persephone')).toThrow(
        badInputError('persephone'),
      );
    });
    it('throws error if name is missing', () => {
      expect(() => normalizeEmail('@hadestown.com')).toThrow(
        badInputError('@hadestown.com'),
      );
    });
    it('throws an error if there is more than one `@` sign', () => {
      expect(() =>
        normalizeEmail('persephone@hadestown.com@spring.ga'),
      ).toThrow(badInputError('persephone@hadestown.com@spring.ga'));
    });
    it('throws an error if there are weird characters', () => {
      expect(() => normalizeEmail('#eurydice@hadestown.com')).toThrow(
        badInputError('#eurydice@hadestown.com'),
      );
    });
    it('lowercases both domain and name', () => {
      const result = normalizeEmail('OrpheusMusic@HadesTown.com');
      expect(result).toEqual('orpheusmusic@hadestown.com');
    });
  });
  describe('contact hash generation', () => {
    const emptyError = new Error(
      'Tried to call `contactHash` with empty contact or contactType',
    );
    it('returns expected value', () => {
      // v1:hades@styx.com:1:86b55bb700c84c179bd9b1dcacc2072c440bfe61f682aba7a3ba62a68c15918d
      const expected =
        '8594ea77b4ee4c8574976bf2cb0d660893936cb4e7f4fbb474c2ea0fc5910abc';
      expect(contactHash('hades@styx.com', 1)).toEqual(expected);
    });
    it('throws error if contact is blank', () => {
      expect(() => contactHash('', 1)).toThrow(emptyError);
    });
    it('throws error if contact is null/undefined', () => {
      expect(() => contactHash(null, 1)).toThrow(emptyError);
    });
    it('throws error if contactType is null/undefined', () => {
      expect(() => contactHash('hades@styx.com', undefined)).toThrow(
        emptyError,
      );
    });
  });
});
