import { URLSearchParams } from 'url';
import config from '../config';
import { RESTDataSource } from '@apollo/datasource-rest';
import md5 from 'md5';
import { backOff } from 'exponential-backoff';
import { NotFoundError } from '@pocket-tools/apollo-utils';
import * as Sentry from '@sentry/node';

enum BoolStringParam {
  FALSE = '0',
  TRUE = '1',
}
type ParserAPIQueryParams = {
  queryParams: URLSearchParams;
  cacheKey: string;
};

/** * A DataSource for resolving item_id from url using
 * the Parser API. Mostly copied from
 * servers/parser-graphql-wrapper/src/datasources/ParserAPI.ts
 */
export class ParserAPI extends RESTDataSource {
  override baseURL = config.parser.baseEndpoint;
  public static readonly params = {
    noArticle: BoolStringParam.TRUE,
    createIfNone: BoolStringParam.FALSE,
    output: 'regular',
  };

  public static generateQueryParams(url: string): ParserAPIQueryParams {
    const queryParams = new URLSearchParams({
      ...ParserAPI.params,
      url,
    });
    return { queryParams, cacheKey: md5(`${url}${queryParams.toString()}`) };
  }

  constructor() {
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
    super({ fetch: fetch });
  }

  /**
   * Gets the itemId from the Parser
   * @param url The URL of the data to fetch
   * @returns stringified numeric itemId
   */
  async getItemId(url: string): Promise<string> {
    url = url.trim();
    const { queryParams, cacheKey } = ParserAPI.generateQueryParams(url);
    const data = await this.get<{ item_id: string }>(config.parser.dataPath, {
      params: queryParams,
      cacheKey: cacheKey,
      cacheOptions: { ttl: 3600 },
    });
    if (data.item_id == null) {
      Sentry.addBreadcrumb({ data: { url } });
      throw new NotFoundError(`Could not resolve Item for URL`);
    }
    return data.item_id;
  }
}
