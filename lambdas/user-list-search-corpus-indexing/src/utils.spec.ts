import { buildCollectionUrl, extractCollectionSlug } from './utils';

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
  describe('extractCollectionSlug', () => {
    it.each([
      {
        url: 'getpocket.com/collections/ten-uses-for-leftover-toenails',
        expected: 'ten-uses-for-leftover-toenails',
      },
      {
        url: 'https://getpocket.com/collections/the-2038-problem-is-coming',
        expected: 'the-2038-problem-is-coming',
      },
      {
        url: 'http://getpocket.com/collections/birds-are-not-real',
        expected: 'birds-are-not-real',
      },
      {
        url: 'https://getpocket.com/de/collections/knoblauch-tips-fuer-vampire',
        expected: 'knoblauch-tips-fuer-vampire',
      },
      {
        url: 'http://getpocket.com/it/collections/just-mozzarella',
        expected: 'just-mozzarella',
      },
      {
        url: 'getpocket.com/jp/collections/fashion-tips-from-harajuku',
        expected: 'fashion-tips-from-harajuku',
      },
      {
        url: 'getpocket.com/collections',
        expected: undefined,
      },
      {
        url: 'https://getpocket.com/en/where-lost-socks-really-go',
        expected: undefined,
      },
      {
        url: 'https://getpocket.com/en/collections/philosophy/are-you-a-new-person-every-day',
        expected: undefined,
      },
    ])(
      'extracts expected data for slug with multiple languages and protocols',
      ({ url, expected }) => {
        expect(extractCollectionSlug(url)).toEqual(expected);
      },
    );
  });
});
