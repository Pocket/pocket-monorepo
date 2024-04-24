import { extractSlugFromReadUrl } from './readersSlug';

describe('Reader slug utils', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      url: 'https://getpocket.com/read/fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
      expected:
        'fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
    },
    {
      url: 'https://getpocket.com/fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
      expected: undefined,
    },
    {
      url: 'https://getpocket.com/reader/fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
      expected: undefined,
    },
    {
      url: 'http://getpocket.com/read/fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
      expected:
        'fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
    },
    {
      url: 'http://getpocket.com/explore/item/123',
      expected: undefined,
    },
    {
      // old slug pattern
      url: 'https://getpocket.com/read/12345789',
      expected: undefined,
    },
    {
      url: 'http://getpocket.com/read/12345123123123123789asdasdasdasdasdasd',
      expected: undefined,
    },
    {
      url: 'http://getpocket.com/read/fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70?124=fa',
      expected:
        'fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
    },
    {
      url: 'http://getpocket.com/read/fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70?utm_source=pocket-saves',
      expected:
        'fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
    },
  ])('extracts slug from read links', ({ url, expected }) => {
    expect(extractSlugFromReadUrl(url)).toBe(expected);
  });
});
