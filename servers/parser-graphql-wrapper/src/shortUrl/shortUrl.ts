import config from '../config';
import {
  BatchAddShareUrlInput,
  SharedUrlsResolverRepository,
} from '../database/mysql';

/**
 * generates a record in share_url if record doesn't exist.
 * otherwise, uses an exisitng id to create shortCode.
 * generates shortUlr using shortCode
 * logic ported from: `getShortUrl()` in `includes/functions.php` from web repo
 * https://github.com/Pocket/Web/blob/0643aa0f59d62104223f8f11ac1b28715b450390/includes/functions.php#L2039
 * //todo: this function right now does single read and single write.
 * this might cause a db load issue for large request at once.
 * move this function behind a data loader.
 * e.g batch read, if not present, then batch write and get pocket share Id
 * and get url.
 * for now, this is minimal risk as its called only by braze client in near future.
 * @param itemId
 * @param resolvedId
 * @param givenUrl
 * @param sharedUrlRepo
 */
export async function getShortUrl(
  itemId: number,
  resolvedId: number,
  givenUrl: string,
  sharedUrlRepo: SharedUrlsResolverRepository,
) {
  const id = await shareUrl.fetchShareUrlId(
    itemId,
    resolvedId,
    givenUrl,
    sharedUrlRepo,
  );
  const shortCode = getShortCodeForId(id);
  const shortUrl = generateShortUrl(givenUrl, shortCode);
  return shortUrl;
}

export async function batchGetShortUrl(
  input: readonly BatchAddShareUrlInput[],
  sharedUrlRepo: SharedUrlsResolverRepository,
): Promise<string[]> {
  const ids = await shareUrl.batchGetOrCreateShareUrls(input, sharedUrlRepo);
  const shortCodes = ids.map((id) => getShortCodeForId(id));
  const givenUrls = input.map(({ givenUrl }) => givenUrl);
  const shortUrls = shortCodes.map((code, ix) =>
    generateShortUrl(givenUrls[ix], code),
  );
  return shortUrls;
}

/**
 * generates shortCode for the given id
 * @param id pocket_shares table's primary key
 * @returns shortCode
 */
export function getShortCodeForId(id: number): string {
  const code = config.shortUrl.shortCodeChars;
  const length = code.length;
  let alnum = '';
  do {
    alnum = code[id % length] + alnum;
  } while ((id = Math.floor(id / length)));
  return alnum;
}

/**
 * Reconstruct ID from the short code
 * @param code
 * @returns
 */
export function getIdFromShortCode(code: string): number {
  const chars = config.shortUrl.shortCodeChars;
  const base = chars.length;
  let id = 0;
  while (code.length) {
    id += chars.indexOf(code[0]);
    id *= code.length > 1 ? base : 1;
    code = code.slice(1);
  }
  return id;
}

/**
 * generates shortUrl using shortCode
 * in the format of pocket.co/x<shortCode> for secure givenUrl
 * in the format of pocket.co/s<shortCode> for non-secure givenUrl
 * @param url given_url of the item (or) url of the corpusItem
 * @param shortCode shortCode generated for the pocket-shares's primary key
 * @returns shortUrl
 */
function generateShortUrl(url: string, shortCode: string): string {
  const protocol = 'https://';
  const domain = url.startsWith('https://')
    ? config.shortUrl.short_prefix_secure
    : config.shortUrl.short_prefix;

  return protocol + domain + shortCode;
}

/**
 * fetches shareUrlId from pocket_shares table if record exists for the given itemId
 * if not, add a record for the itemId and given_url and returns the shareUrlId
 * @param itemId itemId of the item
 * @param resolvedId resolvedId of the item
 * @param givenUrl given_url of the item
 * @param sharedUrlRepo sharedUrlRepo object
 * @returns shareUrlId primary key of the `readitla_shares.share_urls` table
 */
export const shareUrl = {
  fetchShareUrlId: async (
    itemId: number,
    resolvedId: number,
    givenUrl: string,
    sharedUrlRepo: SharedUrlsResolverRepository,
  ): Promise<number> => {
    let id;
    const record = await sharedUrlRepo.getShareUrls(itemId);
    if (!record) {
      id = await sharedUrlRepo.addToShareUrls(itemId, resolvedId, givenUrl);
    } else {
      id = record['shareUrlId'];
    }
    return id;
  },
  /**
   * Batching function for retrieving shareUrlIds. If the record does not exist,
   * one will be created. Retrievals and inserts are each done in a single batch,
   * then compiled to ensure the input shape matches the output shape.
   * @param input list of records containing metadata for fetching/creating shareUrlId
   * @param repo SharedUrlsResolverRespository
   * @returns list of shareUrlIds corresponding to `input`
   */
  batchGetOrCreateShareUrls: async (
    input: readonly BatchAddShareUrlInput[],
    repo: SharedUrlsResolverRepository,
  ): Promise<number[]> => {
    const itemIds = input.map(({ itemId }) => itemId);
    // Get existing shortUrls and compile them into a mapping
    // of { itemId: shortUrlId }
    const resultMapping = (await repo.batchGetShareUrlsById(itemIds)).reduce(
      (mapping, record) => {
        mapping[record.itemId] = record.shareUrlId;
        return mapping;
      },
      {} as { [itemId: number]: number },
    );
    // Compute the missing itemIds so that we can batch generate them
    const returnedIds = new Set(
      Object.keys(resultMapping).map((_) => parseInt(_)),
    );
    const missingIds = Array.from(new Set(itemIds)).filter(
      (elem) => !returnedIds.has(elem),
    );
    if (missingIds) {
      // Build a mapping to look up the associated records
      // in the input for shortUrls we need to generate
      const inputMap = input.reduce(
        (mapping, insert) => {
          mapping[insert.itemId] = insert;
          return mapping;
        },
        {} as { [itemId: number]: BatchAddShareUrlInput },
      );
      const missingRecords = missingIds.map((id) => inputMap[id]);
      const generated = await repo.batchAddToShareUrls(missingRecords);
      // Update the result map with the additional data
      missingIds.forEach((addedId, index) => {
        resultMapping[addedId] = generated[index];
      });
    }
    // Ensure that the output is the same shape as the input (e.g. in case
    // of partially missing data, duplicated keys, etc.)
    return input.map(({ itemId }) => resultMapping[itemId]);
  },
};

/**
 * Retrieve the item_id associated to a given share code
 */
export async function itemIdFromShareCode(
  code: string,
  sharedUrlRepo: SharedUrlsResolverRepository,
): Promise<string> {
  const id = getIdFromShortCode(code);
  const record = await sharedUrlRepo.fetchByShareId(id);
  return record.itemId.toString();
}

export async function givenUrlFromShareCode(
  code: string,
  sharedUrlRepo: SharedUrlsResolverRepository,
): Promise<string> {
  const id = getIdFromShortCode(code);
  const record = await sharedUrlRepo.fetchByShareId(id);
  return record.givenUrl;
}

/**
 * Extract the short code from a URL. If the URL is a valid pocket short
 * share URL, return the code which identifies the share. Otherwise return
 * undefined (e.g. if the URL is not a pocket share URL).
 * @param url the url to attempt to extract the short code from
 * @returns undefined if there is no short code (e.g. the url is not a pocket
 * short share url), or the code if it is
 */
export function extractCodeFromShortUrl(url: string): string | undefined {
  const prefixes = [
    config.shortUrl.short_prefix,
    config.shortUrl.short_prefix_secure,
  ].map((prefix) => escapeRegExp(prefix));
  const regex = `(${prefixes.join('|')})([${config.shortUrl.shortCodeChars}]+)$`;
  const codeMatch = [...url.matchAll(new RegExp(regex, 'g'))][0];
  // A valid URL will have 3 results, and the last is the capture group with the ID
  // - full url
  // - first capture group (the hostname and prefix)
  // - second capture group (the share id code)
  return codeMatch?.length === 3 ? codeMatch[2] : undefined;
}

/**
 * Regex escape function, provided by MDN docs
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
 **/
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
