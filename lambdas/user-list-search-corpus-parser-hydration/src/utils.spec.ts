import { BulkRequestMeta } from './types.ts';
import { buildCollectionUrl, hasExcerptOrIsCollection } from './utils.ts';

describe('utils', () => {
  describe('buildCollectionUrl', () => {
    it.each([
      {
        slug: 'pocket-pride-reads',
        lang: 'EN',
        expected: 'https://getpocket.com/collections/pocket-pride-reads',
      },
      {
        slug: 'pocket-pride-geschichten',
        lang: 'DE',
        expected:
          'https://getpocket.com/de/collections/pocket-pride-geschichten',
      },
    ])(
      'works for english and non-english collections',
      ({ slug, lang, expected }) => {
        expect(buildCollectionUrl(slug, lang)).toEqual(expected);
      },
    );
    it.each([
      {
        slug: 'https://getpocket.com/de/collections/pocket-pride-geschichten',
        lang: 'DE',
        expected:
          'https://getpocket.com/de/collections/pocket-pride-geschichten',
      },
      {
        slug: 'https://getpocket.com/collections/pocket-pride-reads',
        lang: 'EN',
        expected: 'https://getpocket.com/collections/pocket-pride-reads',
      },
    ])('works for full urls', ({ slug, lang, expected }) => {
      expect(buildCollectionUrl(slug, lang)).toEqual(expected);
    });
  });
  describe('isCollectionOrHasExcerpt', () => {
    it.each([
      { excerpt: 'short content', isCollection: true, expected: true },
      { excerpt: 'short content', isCollection: false, expected: true },
      { excerpt: '', isCollection: true, expected: true },
      { excerpt: undefined, isCollection: true, expected: true },
      { excerpt: null, isCollection: true, expected: true },
      { excerpt: '', isCollection: false, expected: false },
      { excerpt: undefined, isCollection: false, expected: false },
      { excerpt: null, isCollection: false, expected: false },
    ])('returns expected result', ({ excerpt, isCollection, expected }) => {
      const testCase: BulkRequestMeta = {
        meta: { _id: 'abc-123', _index: 'corpus_en_luc' },
        url: 'https://getpocket.com',
        messageId: '34dfkj',
        title: 'titular',
        excerpt,
        isCollection,
      };
      expect(hasExcerptOrIsCollection(testCase)).toEqual(expected);
    });
  });
});
