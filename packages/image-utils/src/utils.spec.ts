import { getOriginalUrlIfPocketImageCached } from './utils.ts';

describe('getOriginalUrlIfPocketImageCached', () => {
  it('gets the original image if it has been encoded already', () => {
    const url =
      'https://pocket-image-cache.com/400x/filters:format(jpg):extract_focal()/https%3A%2F%2Fi.picsum.photos%2Fid%2F1015%2F6000%2F4000.jpg';
    const newUrl = getOriginalUrlIfPocketImageCached(url);

    expect(newUrl).toBe('https://i.picsum.photos/id/1015/6000/4000.jpg');
  });

  it('gets the original image if it has not been through the pocket image cache', () => {
    const url = 'https://i.picsum.photos/id/1015/6000/4000.jpg';
    const newUrl = getOriginalUrlIfPocketImageCached(url);

    expect(newUrl).toBe('https://i.picsum.photos/id/1015/6000/4000.jpg');
  });

  it('gets the original image if it has not been through the pocket image cache in the old format', () => {
    const url =
      'https://pocket-image-cache.com/direct?resize=2000w&url=https%3A%2F%2Fi.picsum.photos%2Fid%2F1015%2F6000%2F4000.jpg';
    const newUrl = getOriginalUrlIfPocketImageCached(url);

    expect(newUrl).toBe('https://i.picsum.photos/id/1015/6000/4000.jpg');
  });

  it('gets undefined if the cache url in old format is missing the url param', () => {
    const url = 'https://pocket-image-cache.com/direct?resize=2000w';
    expect(() => {
      getOriginalUrlIfPocketImageCached(url);
    }).toThrow(new Error('Source URL Missing'));
  });
});
