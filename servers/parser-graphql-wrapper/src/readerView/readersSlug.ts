import { itemIdFromSlug } from './idUtils';
import DataLoader from 'dataloader';
import { ItemLoaderType } from '../dataLoaders';

export async function urlFromReaderSlug(
  slug: string,
  itemIdLoader: DataLoader<string, ItemLoaderType>,
): Promise<string | null> {
  const id = itemIdFromSlug(slug);
  if (id == null) {
    return null;
  }
  const itemLoaderResult = await itemIdLoader.load(id);

  if (itemLoaderResult == null || itemLoaderResult.url == null) {
    return null;
  }

  return itemLoaderResult.url;
}

/**
 * Extract the e code from a URL. If the URL is a valid reader sharable link URL,
 * return the encoded item id. Otherwise return undefined (e.g. if the URL is not a pocket reader URL).
 * @param url the url to attempt to extract the encoded item id from
 * @returns undefined if there is no slug to get or the encoded item id if it is a reader url
 */
export function extractSlugFromReadUrl(url: string): string | undefined {
  const regex =
    /^(?:https?:\/\/)?getpocket\.com\/read\/([A-Za-z\d]+_[A-Za-z\d]+)(?:(?:\/?)|(?:\?[A-Za-z_\-\d]+=[A-Za-z_\-\d]+)(?:\\&[A-Za-z_\-\d]+=[A-Za-z_\-\d]+)*)$/;
  const match = url.match(regex);
  return match ? match[1] : undefined;
}
