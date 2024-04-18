import { URLSearchParams } from 'url';
import config from '../config';
import { RESTDataSource } from '@apollo/datasource-rest';
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
import { ParserResponse } from './ParserAPITypes';
import fetchRetry from 'fetch-retry';

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
  article: BoolStringParam;
  createIfNone: BoolStringParam;
  output: 'regular';
};

/**
 * A DataSource for retrieving article data from the Parser
 * REST API.
 */
export class ParserAPI extends RESTDataSource {
  override baseURL = config.parser.baseEndpoint;

  public static readonly DEFAULT_PARSER_OPTIONS: ParserAPIOptions = {
    refresh: BoolStringParam.FALSE,
    article: BoolStringParam.FALSE,
    images: MediaTypeParam.AS_COMMENTS,
    videos: MediaTypeParam.AS_COMMENTS,
    createIfNone: BoolStringParam.TRUE,
    output: 'regular',
  };

  // constructor() {
  //   super({
  //     fetch: fetchRetry(global.fetch, {
  //       retries: config.parser.retries,
  //       retryDelay: 500,
  //     }),
  //   });
  // }

  /**
   * Gets the baseline Item data from the Pocket parser excluding the article data
   * @param url The URL of the data to fetch
   * @param refresh Whether or not to refresh the article data
   * @returns Item object
   */
  async getItemData(
    url: string,
    options?: Partial<ParserAPIOptions>,
  ): Promise<Item> {
    url = url.trim();
    const queryParams = new URLSearchParams({
      ...ParserAPI.DEFAULT_PARSER_OPTIONS,
      ...options,
      url,
    });
    return this.parserResponseToItem(
      await this.get<ParserResponse>(config.parser.dataPath, {
        params: queryParams,
        cacheKey: md5(`${url}${queryParams.toString()}`),
        signal: AbortSignal.timeout(config.parser.timeout * 1000),
      }),
    );
  }

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
    };
  }
}
