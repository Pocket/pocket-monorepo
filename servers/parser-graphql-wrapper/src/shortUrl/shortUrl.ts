import config from '../config';
import { SharedUrlsResolverRepository } from '../database/mysql';

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
};
