import config from '../config';
import { setTimeout } from 'timers/promises';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';

export type PartialGetItemResponse = {
  // This is modeling a subset of the response
  // for the Parser's getItem endpoint; right now
  // we only are using item_id
  item_id: string;
};

export type ItemResponse = {
  itemId: string;
  resolvedId: string;
  title?: string;
};

/**
 * Method to connect to parser api to receive required item fields
 * for the given_url: itemId, resolvedId, and title
 * This is required by listApi to make a record
 * in list table.
 */
export class ParserCaller {
  private static async internalGetOrCreateItem(
    url: string,
  ): Promise<ItemResponse> {
    const response = await fetch(
      `${config.parserDomain}/${
        config.parserVersion
      }/getItemListApi?url=${encodeURIComponent(url)}&getItem=1`,
    );
    Sentry.addBreadcrumb({ data: { method: 'internalGetOrCreateItem', url } });
    if (!response.ok) {
      const data = await response.text();
      serverLogger.error({
        message: 'Unable to parse and generate item for url',
        status: response.status,
        statusText: response.statusText,
        url: url,
      });
      Sentry.addBreadcrumb({ data: { status: response.status, body: data } });
      throw new Error(`Unable to parse and generate item for url`);
    }
    const data: any = await response.json();
    const item = data.item;
    if (
      !item ||
      (item && (!item.item_id || item.item_id === null)) ||
      (item &&
        (!item.resolved_id || item.resolved_id === null) &&
        (!data.resolved_id || data.resolved_id === null))
    ) {
      serverLogger.error({
        message: 'Parser responded with null item data',
        url,
        response: data,
      });
      throw new Error(`Parser responded with null item data`);
    }

    return {
      itemId: item.item_id,
      resolvedId: item.resolved_id ?? data.resolved_id,
      title: item.title ?? '',
    };
  }

  public static async getOrCreateItem(
    url: string,
    tries = config.parserRetries,
  ): Promise<ItemResponse> {
    const requestCallback = () => this.internalGetOrCreateItem(url);
    return this.sendRequest(requestCallback, tries);
  }

  private static async sendRequest<R>(
    requestCallback: () => Promise<R>,
    tries = config.parserRetries,
  ): Promise<R> {
    let lastError = null;
    while (tries > 0) {
      try {
        return await requestCallback();
      } catch (e) {
        lastError = e;
      }
      await setTimeout(500);
      tries--;
    }

    throw lastError;
  }

  /**
   * Get the Parser-generated itemId for a given url.
   * TODO[IN-1478]: stop using this method once given_url is indexed in the list table
   * https://getpocket.atlassian.net/browse/IN-1478
   * @param url the URL of the Save you want an itemId for
   * @param tries # of request retries if there are issues with the Parser service
   * @returns the itemId for the given url, or null if it does not exist
   */
  public static async getItemIdFromUrl(
    url: string,
    tries = config.parserRetries,
  ): Promise<string | null> {
    const requestCallback = () => this.internalGetItemIdFromUrl(url);
    return this.sendRequest(requestCallback, tries);
  }

  /**
   * Get the Parser-generated itemId for a given url.
   * TODO[IN-1478]: Stop using this method once given_url is indexed in the list table
   * https://getpocket.atlassian.net/browse/IN-1478
   * @param url the URL of the Save you want an itemId for
   * @returns the itemId for the given url
   * @throws Error if item does not exist
   */
  public static async internalGetItemIdFromUrl(url: string): Promise<string> {
    const response = await fetch(
      `${config.parserDomain}/${
        config.parserVersion
      }/getItem?url=${encodeURIComponent(url)}&createIfNone=false`,
    );

    const data: PartialGetItemResponse | null =
      (await response.json()) as PartialGetItemResponse;
    return data?.item_id ?? null;
  }
}
