import { CachedImageInput, ImageFileType } from '../types';

/**
 * Given the image and cached input, build the Pocket Image Cache end path of the url
 * @param url
 * @param input
 * @returns
 */
export const getPocketImageCachePath = (
  url: string,
  input: CachedImageInput,
) => {
  return `${getPocketImageCacheURLPathFilters(input)}/${getEncodedImageUrl(
    url,
  )}`;
};

/**
 * Given a set of input values from clients, built a Pocket Image Cache url pattern set.
 * Note: The underlying technology as of 8/8/2022 is Thumbor, but could change in the future.
 * @param input
 * @returns
 */
export const getPocketImageCacheURLPathFilters = (
  input: CachedImageInput,
): string => {
  const size = `${input.width ?? ''}x${input.height ?? ''}`;
  const fileType = `:format(${input.fileType ?? ImageFileType.JPEG})`;
  const quality = `:quality(${input.qualityPercentage ?? '100'})`;
  const extraFilters = `:no_upscale():strip_exif()`;
  return `${size}/filters${fileType}${quality}${extraFilters}`;
};

/**
 * Given an image url, get a url encoded image string to use with the Pocket Image Cache
 * @param url
 * @returns
 */
export const getEncodedImageUrl = (url: string) => {
  return encodeURIComponent(url);
};
