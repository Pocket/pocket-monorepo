import { getPocketImageCacheURLPathFilters } from '.';
import { CachedImageInput } from '../types';

describe('getPocketImageCacheURLPathFilters', () => {
  it('works with no input and returns defaults', () => {
    const testInput: CachedImageInput = { id: 'testId' };
    expect(getPocketImageCacheURLPathFilters(testInput)).toEqual(
      'x/filters:format(JPEG):quality(100):no_upscale():strip_exif()',
    );
  });
});
