import {
  normalizeFullText,
  normalizeDate,
  mysqlTimeStampToDate,
  normalizeUrl,
} from './util';

describe('util', () => {
  describe('normalizeFullText()', () => {
    it('strips all html tags and whitespace', () => {
      const input = " <HTML><a href='#'>a    link</a><BR ></HTML>   ";
      const expected = 'a link';
      expect(normalizeFullText(input)).toBe(expected);
    });

    it('returns null for empty text', () => {
      expect(normalizeFullText(null)).toBeNull();
      expect(normalizeFullText(undefined)).toBeNull();
      expect(normalizeFullText('')).toBeNull();
    });
  });

  describe('mysqlTimeStampToDate()', () => {
    it('null date', () => {
      const input = '0000-00-00 00:00:00';
      expect(mysqlTimeStampToDate(input)).toBeNull();
    });

    it('returns null for empty text', () => {
      expect(mysqlTimeStampToDate('')).toBeNull();
      expect(mysqlTimeStampToDate('   ')).toBeNull();
    });

    it('returns null for null', () => {
      expect(mysqlTimeStampToDate(null)).toBeNull();
    });

    it('actual date', () => {
      const input = '2019-01-05 01:33:33';
      const converted = mysqlTimeStampToDate(input);
      expect(converted).toStrictEqual(new Date('2019-01-05T01:33:33'));
    });
  });

  describe('normalize date', () => {
    it('normalized date', () => {
      expect(normalizeDate(new Date('2019-01-05T01:33:33'))).toBe(
        new Date('2019-01-05T01:33:33').toISOString(),
      );
    });

    it('null date', () => {
      expect(normalizeDate(null)).toBeNull();
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize a url', () => {
      expect(normalizeUrl('https://www.superbad.com?foo=bar&boom=bap')).toBe(
        'https://www.superbad.com',
      );
      expect(normalizeUrl('https://superbad.com?foo=bar&boom=bap')).toBe(
        'https://superbad.com',
      );
    });
  });
});
