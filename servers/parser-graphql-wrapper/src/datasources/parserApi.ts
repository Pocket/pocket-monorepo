import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { KeyValueCache } from 'apollo-server-caching';
import { URLSearchParams } from 'url';
import config from '../config';
import DataLoader from 'dataloader';
import { FetchHandler } from '../fetch';

interface ParserRequestParams {
  url: string;
  getItem: number;
  output: string;
  images: MediaTypeParam;
  videos: MediaTypeParam;
  refresh?: boolean;
}

interface GetArticleByUrlOptions {
  imageStyle?: MediaTypeParam;
  videoStyle?: MediaTypeParam;
  refresh?: boolean;
  maxAge?: number;
  createIfNone?: boolean;
}

export enum MediaTypeParam {
  AS_COMMENTS = 0,
  NO_POSITION = 1,
  DIV_TAG = 2,
  WITH_POSITION = 3,
}

export type ParserArticle = {
  isArticle: boolean;
  isVideo: boolean;
  article: string;
  images?: { [key: string]: any } | null;
  videos?: { [key: string]: any } | null;
  givenUrl: string;
};

/**
 * A DataSource for retrieving article data from the Parser
 * REST API. A new instance is created for each incoming operation.
 * Uses the cache configured when starting Apollo Server (or a new
 * in-memory LRU cache by default). Methods are designed for making GET
 * requests only since that's all we need right now.
 * https://www.apollographql.com/docs/apollo-server/data/data-sources/
 */
export class ParserAPI<TContext = any> extends DataSource {
  public static readonly baseUrl = config.parserEndpoint;
  // TODO: Confirm that images=0 is the same as not having images query param
  // Default query parameters for GET-ing an article.
  public static readonly defaultParams = {
    getItem: 1,
    output: 'regular',
    images: MediaTypeParam.AS_COMMENTS,
    videos: MediaTypeParam.AS_COMMENTS,
    createIfNone: true,
  };

  public context!: TContext;
  public articleLoader!: DataLoader<
    { url: string; options?: GetArticleByUrlOptions },
    ParserArticle
  >;
  private cache!: KeyValueCache;

  // Always need to call super()
  constructor() {
    super();
    // DataLoader layer deduplicates requests made in a single tick of the
    // application by storing results in a memoization cache.
    // If not using the dataloader, it's possible that multiple requests
    // to fetch the article will be sent, despite the shared cache
    // (e.g. requesting both `marticle` and `article` fields in the same query)
    this.articleLoader = new DataLoader(
      async (requests: { url: string; options?: GetArticleByUrlOptions }[]) => {
        // Don't load from cache if refresh option is true
        // This is overly cautious at this time, since the code
        // does not call the dataloader during the refresh mutation
        requests.forEach((request) => {
          if (request.options?.refresh) {
            this.articleLoader.clear(request);
          }
        });
        return Promise.all(
          requests.map(async ({ url, options }) => {
            return this.getArticleByUrl(url, options);
          }),
        );
      },
      {
        // Stringify the call made to `getArticleByUrl` as the cache key,
        // minus arguments that won't change the result
        cacheKeyFn: ({ url, options }) => {
          const relevantOptions = { ...options };
          delete relevantOptions.maxAge;
          return JSON.stringify({ url, options: relevantOptions });
        },
      },
    );
  }

  /**
   * Initialize method with Apollo context and cache. This method
   * is called automatically by Apollo Server. Require a shared
   * server cache to initialize the datasource, otherwise throw
   * an error.
   */
  initialize(config: DataSourceConfig<any>): void | Promise<void> {
    this.context = config.context;
    if (!config.cache) {
      throw new Error(
        'ParserApi requires shared server cache, but found none; check Apollo server cache configuration.',
      );
    }
    this.cache = config.cache;
  }

  /**
   * Build the cache key for a GET request to the parser endpoint.
   * We remove the `refresh` param from the
   * cache key so that we can set refreshed results and retrieve
   * them later. Sorting ensures tha query parameter order doesn't
   * affect cache key.
   * @param request
   * @returns
   */
  static cacheKeyFor(params: URLSearchParams): string {
    // Mutability :|
    const paramsCopy = new URLSearchParams(params.toString());
    paramsCopy.sort();
    paramsCopy.delete('refresh');
    return ParserAPI.baseUrl + paramsCopy.toString();
  }

  /**
   * Build the query string for GET request, with query parameters.
   * Made public to help testing.
   */
  public static buildQueryString(params: ParserRequestParams): {
    query: string;
    cacheKey: string;
  } {
    const urlParams = Object.entries(params).reduce(
      (paramsObject, [key, val]) => {
        if (val != null) {
          paramsObject.append(key, val.toString());
        }
        return paramsObject;
      },
      new URLSearchParams(),
    );
    const query = urlParams.toString();
    return { query, cacheKey: ParserAPI.cacheKeyFor(urlParams) };
  }

  /**
   * Make a GET request to an endpoint. Check the cache if allowed, and return
   * the cached result if it exists. If there is no cached result, or if noCache
   * is true, then fetch the data from the endpoint and store the result in the
   * cache if it's valid. Will not cache errors or null responses.
   * @param endpoint the GET request url
   * @param cacheKey key for caching/retrieving result from cache
   * @param noCache if true, don't check the cache first (do cache the result)
   * @param maxAge the max age, in seconds, before the cache is stale, for
   * new results that are put into the cache.
   */
  private async get(
    endpoint: string,
    cacheKey: string,
    noCache: boolean,
    maxAge: number,
  ): Promise<ParserArticle> {
    // Grab from the cache first if we are allowed
    if (!noCache) {
      const cachedData: any = await this.cache.get(cacheKey);
      if (cachedData != null) {
        return JSON.parse(cachedData);
      }
    }
    // If we shouldn't use the cache, or the key does not exist/has expired,
    // fetch the data and then cache the response with appropriate expiration
    const articleData = await this.fetch(endpoint);
    if (articleData != null) {
      await this.cache.set(cacheKey, JSON.stringify(articleData), {
        ttl: maxAge,
      });
    }
    return articleData;
  }

  /**
   * Small wrapper around node-fetch for fetching and parsing an article.
   * Only works for GET requests since that's all we need right now.
   * Send exception to Sentry if the item doesn't exist.
   * @param endpoint the GET request endpoint, with query string included
   * as needed.
   * @returns the parsed article, or null, if the item doesn't exist
   */
  private async fetch(endpoint: string): Promise<ParserArticle> {
    const articleData = await new FetchHandler().fetchJSON(endpoint);
    // check if there's an item
    if (!articleData || (articleData && !articleData.item)) {
      throw new Error(`No item found for URL: ${endpoint}`);
    }
    return {
      isArticle: articleData.isArticle === 1,
      isVideo: articleData.isVideo === 1,
      article: articleData.article,
      givenUrl: articleData.item.given_url,
      images: articleData.images ?? null,
      videos: articleData.videos ?? null,
    };
  }

  /**
   * Method for fetching an article from the Parser HTTP endpoint.
   * @param url the URL to parse the article
   * @param options Additional options for the parser.
   *  `imageStyle`: an integer representing how images should be
   * returned. See `MediaTypeParam` for descriptive enum mapping
   * to the integer values. Default: IMAGES_AS_COMMENTS (0)
   *  `refresh`: whether to trigger re-parsing an article. If
   * true, will bypass the cache to fetch the article (but will)
   * cache the new refreshed result. Default: false
   *  `maxAge`: the time in seconds before a newly cached result
   * expires. Relevant for cache misses or if `refresh`=true.
   * Default: config.app.defaultMaxAge
   */
  async getArticleByUrl(
    url: string,
    options?: GetArticleByUrlOptions,
  ): Promise<ParserArticle> {
    // Parse options and build parameters with defaults
    const params = {
      ...ParserAPI.defaultParams,
      url: url,
    } as ParserRequestParams;
    // Override defaults if provided
    if (options?.refresh != null) {
      params['refresh'] = options?.refresh;
    }
    if (options?.imageStyle != null) {
      params['images'] = options?.imageStyle;
    }
    if (options?.videoStyle != null) {
      params['videos'] = options?.videoStyle;
    }
    const maxAge = options?.maxAge ?? config.app.defaultMaxAge;

    const { query, cacheKey } = ParserAPI.buildQueryString(params);
    const endpoint = `${ParserAPI.baseUrl}?${query}`;

    return await this.get(endpoint, cacheKey, !!options?.refresh, maxAge);
  }
}
