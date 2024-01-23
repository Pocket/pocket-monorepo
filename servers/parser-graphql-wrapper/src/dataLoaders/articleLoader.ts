import * as Sentry from '@sentry/node';
import DataLoader from 'dataloader';
import { batchCacheFn, LoaderCacheInterface } from '@pocket-tools/apollo-utils';
import config from '../config';
import { getElasticacheRedis } from '../cache';
import { FetchHandler } from '../fetch';
import { serverLogger } from '@pocket-tools/ts-logger';

export type ParserArticle = {
  article: string;
  images?: { [key: string]: any } | null;
  videos?: { [key: string]: any } | null;
  givenUrl: string;
};

export enum MediaTypeParam {
  IMAGES_AS_COMMENTS,
  IMAGES_NO_POSITION,
  IMAGES_DIV_TAG,
  IMAGES_WITH_POSITION,
}

/**
 * Gets the article text by the url
 * @param url
 * @param imageStyle
 */
export const getArticleByUrl = async (
  url: string,
  imageStyle?: number,
): Promise<ParserArticle> => {
  let endpoint = `${config.parserEndpoint}?url=${encodeURIComponent(
    url,
  )}&getItem=1&output=regular`;
  if (imageStyle != null) {
    endpoint = endpoint + `&images=${imageStyle}`;
  }
  const data = await new FetchHandler().fetchJSON(endpoint);
  // check if there's an item
  if (!data || (data && !data.item)) {
    Sentry.captureException(new Error(`No item found for URL: ${url}`));
    return null;
  }

  return {
    article: data.article,
    givenUrl: data.item.given_url,
    images: data.images ?? null,
    videos: data.videos ?? null,
  };
};

/**
 * Batch function to get article text from parser by the urls
 * @param urls
 */
export const batchGetArticleTextByUrl = async (
  urls: string[],
): Promise<ParserArticle[]> => {
  const texts = urls.map((url) => {
    if (!url) {
      return null;
    }

    return getArticleByUrl(url).catch((error) => {
      const errorMessage =
        'batchGetArticleTextByUrl: Could not get article text.';
      const errorData = {
        URL: url,
      };
      serverLogger.error(errorMessage, { error: error, data: errorData });
      Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
      Sentry.captureException(error);
      return null;
    });
  });

  return await Promise.all(texts);
};

/**
 * Batch function to get article texts and cache
 * @param urls
 * @param cache
 */
export const batchLoadArticleTextByUrl = async (
  urls: string[],
  cache: LoaderCacheInterface,
): Promise<ParserArticle[]> => {
  return batchCacheFn<string, ParserArticle>({
    values: urls,
    valueKeyFn: (url) => url,
    callback: batchGetArticleTextByUrl,
    cache,
    cacheKeyPrefix: 'article-text-',
    returnTypeKeyFn: (text) => text.givenUrl,
    maxAge: config.app.defaultMaxAge,
  });
};

/**
 * Loader to batch requests
 */
export const articleLoader = new DataLoader(
  (urls: string[]) => batchLoadArticleTextByUrl(urls, getElasticacheRedis()),
  {
    cache: false,
  },
);
