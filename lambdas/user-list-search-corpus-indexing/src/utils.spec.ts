import { buildCollectionUrl } from './utils';

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
      expected: 'https://getpocket.com/de/collections/pocket-pride-geschichten',
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
      expected: 'https://getpocket.com/de/collections/pocket-pride-geschichten',
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
