import { expect } from 'chai';
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
      expect(normalizeFullText(input)).to.equal(expected);
    });

    it('returns null for empty text', () => {
      expect(normalizeFullText(null)).to.equal(null);
      expect(normalizeFullText(undefined)).to.equal(null);
      expect(normalizeFullText('')).to.equal(null);
    });
  });

  describe('mysqlTimeStampToDate()', () => {
    it('null date', () => {
      const input = '0000-00-00 00:00:00';
      expect(mysqlTimeStampToDate(input)).to.equal(null);
    });

    it('returns null for empty text', () => {
      expect(mysqlTimeStampToDate('')).to.equal(null);
      expect(mysqlTimeStampToDate('   ')).to.equal(null);
    });

    it('returns null for null', () => {
      expect(mysqlTimeStampToDate(null)).to.equal(null);
    });

    it('actual date', () => {
      const input = '2019-01-05 01:33:33';
      const converted = mysqlTimeStampToDate(input);
      expect(converted).to.eql(new Date('2019-01-05T01:33:33'));
    });
  });

  describe('normalize date', () => {
    it('normalized date', () => {
      expect(normalizeDate(new Date('2019-01-05T01:33:33'))).to.equal(
        new Date('2019-01-05T01:33:33').toISOString()
      );
    });

    it('null date', () => {
      expect(normalizeDate(null)).to.be.null;
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize a url', () => {
      expect(
        normalizeUrl('https://www.superbad.com?foo=bar&boom=bap')
      ).to.equal('https://www.superbad.com');
      expect(normalizeUrl('https://superbad.com?foo=bar&boom=bap')).to.equal(
        'https://superbad.com'
      );
    });
  });
});
