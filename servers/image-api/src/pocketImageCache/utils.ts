import { NotFoundError } from '@pocket-tools/apollo-utils';
import parseUrl from 'parse-url';

//Functions on this page taken from Web Client.
//https://github.com/Pocket/web-client/blob/main/src/common/utilities/urls/urls.js

/**
 * This function exists to ensure that we don't double encode urls into our pocket image cache.
 * Some of our APIs today do not return the original url and return the image cached url already.
 * This ensures that we get the original url in this case.
 * @param url
 * @returns
 */
export const getOriginalUrlIfPocketImageCached = (url: string): string => {
  const urlCheck = /^https:\/\/pocket-image-cache\.com\//;
  const isEncoded = url.match(urlCheck);

  // If we have an encoded url ket;s grab the original url
  if (isEncoded) {
    const urlToUse = extractImageCacheUrl(url);
    if (!urlToUse) {
      throw new NotFoundError('Pocket image cache url is missing a source url');
    }
    return decodeURIComponent(urlToUse);
  }

  //The url is not currently encoded for the Image cache so lets just return it.
  return url;
};

const extractImageCacheUrl = (url: string): string | null => {
  const urlToUse = extractImageCacheUrlFromNewFormat(url);
  if (urlToUse) {
    return urlToUse;
  }

  return extractImageCacheUrlFromOldFormat(url);
};

/**
 * This extracts original url if they are pre-encoded as well as dimensions
 * REGEX for extractions: https://regexr.com/6b8j4
 * @param {string} url
 * @returns {string|null}
 */
const extractImageCacheUrlFromNewFormat = (url: string): string | null => {
  const cachedUrlTest = /(?:^https:\/\/pocket-image-cache\.com\/)(?:((?:[0-9]+)?x(?:[0-9]+)?)?\/filters:format\((?:jpe?g|png|webp)\):extract_focal\(\)\/)(.+)/ //prettier-ignore
  const match = url.match(cachedUrlTest);
  return match ? match[2] : null;
};

/**
 * This extracts original url if they are pre-encoded from our old image api format at /direct?url=https://blah
 * @param {string} url
 * @returns {string|null}
 */
const extractImageCacheUrlFromOldFormat = (url: string): string | null => {
  const cachedUrlTest = /(?:^https:\/\/pocket-image-cache\.com\/direct)(.+)/ //prettier-ignore
  const match = url.match(cachedUrlTest);

  if (!match) {
    return null;
  }

  const parsedUrl = parseUrl(url);
  return parsedUrl.query.url;
};
