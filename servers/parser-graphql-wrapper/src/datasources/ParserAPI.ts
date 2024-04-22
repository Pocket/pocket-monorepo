import { URLSearchParams } from 'url';
import config from '../config';
import { DataSourceConfig, RESTDataSource } from '@apollo/datasource-rest';
import md5 from 'md5';
import { Item } from '../__generated__/resolvers-types';
import { IntMask } from '@pocket-tools/int-mask';
import {
  getAuthors,
  getImages,
  getVideos,
  normalizeDate,
  parseVideoness,
  parseImageness,
  extractDomainMeta,
} from './parserApiUtils';
import { ListenModel } from '../models/ListenModel';
import type {
  KeyValueCache,
  KeyValueCacheSetOptions,
} from '@apollo/utils.keyvaluecache';
import { ParserResponse } from './ParserAPITypes';
import fetch from 'node-fetch';
import { backOff } from 'exponential-backoff';

export enum MediaTypeParam {
  AS_COMMENTS = '0',
  NO_POSITION = '1',
  DIV_TAG = '2',
  WITH_POSITION = '3',
}

export enum BoolStringParam {
  FALSE = '0',
  TRUE = '1',
}

export type ParserAPIOptions = {
  refresh: BoolStringParam;
  images: MediaTypeParam;
  videos: MediaTypeParam;
  noArticle: BoolStringParam;
  createIfNone: BoolStringParam;
  output: 'regular';
};

export type ParserAPIQueryParams = {
  queryParams: URLSearchParams;
  cacheKey: string;
};

/**
 * A DataSource for retrieving article data from the Parser
 * REST API.
 */
export class ParserAPI extends RESTDataSource {
  override baseURL = config.parser.baseEndpoint;

  public static generateQueryParams(
    url: string,
    options?: Partial<ParserAPIOptions>,
  ): ParserAPIQueryParams {
    const queryParams = new URLSearchParams({
      ...ParserAPI.DEFAULT_PARSER_OPTIONS,
      ...options,
      url,
    });

    const cachedParams = new URLSearchParams({
      ...ParserAPI.DEFAULT_PARSER_OPTIONS,
      ...options,
      url,
      // delete the refresh param when making our cache key its not important when deciding which cached content to pull out,
      // and weould cause cache misses if a request comes in after we refreshed content
      refresh: undefined,
    });

    return { queryParams, cacheKey: md5(`${url}${cachedParams.toString()}`) };
  }

  public static readonly DEFAULT_PARSER_OPTIONS: ParserAPIOptions = {
    refresh: BoolStringParam.FALSE,
    noArticle: BoolStringParam.TRUE,
    images: MediaTypeParam.DIV_TAG,
    videos: MediaTypeParam.DIV_TAG,
    createIfNone: BoolStringParam.TRUE,
    output: 'regular',
  };

  private cache: KeyValueCache<string, KeyValueCacheSetOptions>;

  constructor(datasourceConfig: DataSourceConfig) {
    // Set up custom fetch - exponential backoff with request timeout
    const backoffFetch = (url: string) =>
      backOff(
        () =>
          fetch(url, {
            signal: AbortSignal.timeout(config.parser.timeout * 1000),
          }),
        {
          delayFirstAttempt: false,
          jitter: 'full',
          maxDelay: 1000,
          numOfAttempts: config.parser.retries,
        },
      );
    super({ ...datasourceConfig, fetch: backoffFetch });
    this.cache = datasourceConfig.cache;
  }

  async clearCache(cacheKey: string) {
    this.cache.delete(`httpcache:${cacheKey}`);
  }

  /**
   * Gets the baseline Item data from the Pocket parser excluding the article data
   * @param url The URL of the data to fetch
   * @param refresh Whether or not to refresh the article data
   * @returns Item object
   */
  async getItemData(
    url: string,
    options?: Partial<ParserAPIOptions>,
    clearCache: boolean = false,
  ): Promise<Item> {
    url = url.trim();
    const { queryParams, cacheKey } = ParserAPI.generateQueryParams(
      url,
      options,
    );
    if (clearCache) {
      this.clearCache(cacheKey);
    }
    const data = await this.get<ParserResponse>(config.parser.dataPath, {
      params: queryParams,
      cacheKey: cacheKey,
      cacheOptions: { ttl: 3600 },
    });
    return this.parserResponseToItem(data);
  }

  /**
   * Takes a response from the pocket parser and converts it to an item
   * @param parserResponse
   * @returns
   */
  private parserResponseToItem(parserResponse: ParserResponse): Item {
    return {
      itemId: parserResponse.item_id,
      id: IntMask.encode(parserResponse.item_id),
      resolvedId: parserResponse.resolved_id,
      topImageUrl: parserResponse.topImageUrl,
      topImage: parserResponse.topImageUrl
        ? {
            url: parserResponse.topImageUrl,
            src: parserResponse.topImageUrl,
            imageId: 0,
          }
        : undefined,
      dateResolved: normalizeDate(parserResponse.date_resolved),
      normalUrl: parserResponse.normal_url,
      givenUrl: parserResponse.given_url,
      title: parserResponse.title,
      ampUrl: parserResponse.resolvedUrl,
      resolvedUrl: parserResponse.resolvedUrl,
      isArticle: !!parserResponse.isArticle,
      isIndex: !!parserResponse.isIndex,
      hasVideo: parseVideoness(parserResponse.has_video),
      hasImage: parseImageness(parserResponse.has_image),
      excerpt: parserResponse.excerpt,
      wordCount: parserResponse.wordCount,
      timeToRead: parserResponse.time_to_read,
      listenDuration: ListenModel.estimateDuration(parserResponse.wordCount),
      images: Object.keys(parserResponse.images || {}).length
        ? getImages(parserResponse.images)
        : null,
      videos: Object.keys(parserResponse.videos || {}).length
        ? getVideos(parserResponse.videos)
        : null,
      authors: Object.keys(parserResponse.authors || {}).length
        ? getAuthors(parserResponse.authors)
        : null,
      mimeType: parserResponse.mime_type,
      encoding: parserResponse.encoding,
      domainMetadata: extractDomainMeta(parserResponse),
      language: parserResponse.lang,
      datePublished: normalizeDate(parserResponse.datePublished),
      hasOldDupes: !!parseInt(parserResponse.has_old_dupes),
      domainId: parserResponse.domain_id,
      originDomainId: parserResponse.origin_domain_id,
      responseCode: parseInt(parserResponse.responseCode),
      contentLength: parserResponse.content_length,
      innerDomainRedirect: !!parserResponse.innerdomain_redirect,
      loginRequired: !!parserResponse.requiresLogin,
      usedFallback: parserResponse.usedFallback,
      timeFirstParsed: normalizeDate(parserResponse.time_first_parsed),
      resolvedNormalUrl: parserResponse.resolved_normal_url,
      article: parserResponse.article,
    };
  }
}
