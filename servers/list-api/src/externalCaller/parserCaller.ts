import fetch from 'node-fetch';
import config from '../config';
import { setTimeout } from 'timers/promises';

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

    const data: any = await response.json();
    const item = data.item;
    if (!item || (item && !item.item_id) || (item && !item.resolved_id)) {
      throw new Error(`Unable to parse and generate item for ${url}`);
    }

    return {
      itemId: item.item_id,
      resolvedId: item.resolved_id,
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
