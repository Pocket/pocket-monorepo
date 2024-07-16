import DataLoader from 'dataloader';
import {
  SavedItemTagsInput,
  SavedItemTagsMap,
  TagSaveAssociation,
} from '../types';

/**
 * Returns a URl that will always have some kind of HTTP prefix if one does not exist.
 * @param url URL that we want to update to have a prefix
 */
export function ensureHttpPrefix(url: string): string {
  const urlPattern = /^(https?|ftp|mailto|file|data|ws|wss|tel):\/?\/?/i; // Regex to match common URL schemes
  if (!urlPattern.test(url)) {
    return 'http://' + url;
  }
  return url;
}

/**
 * Returns a savedItemMap from the list of tags.
 * @param tags list of tags from which savedItem keys are generated.
 */
export function getSavedItemMapFromTags(tags) {
  const savedItemMap = {};
  tags.forEach((tag) => {
    tag.savedItems.forEach((savedItemId) => {
      if (savedItemMap[savedItemId]) {
        savedItemMap[savedItemId].push(tag);
      } else {
        savedItemMap[savedItemId] = [tag];
      }
    });
  });
  return savedItemMap;
}

/**
 * function to convert savedItemTagsInput list to a
 * map of savedItemId and its unique tag names.
 * @param input savedItemInput list
 * @returns map with savedItemId and its unique tagNames
 */
export function getSavedItemTagsMap(
  input: SavedItemTagsInput[],
): SavedItemTagsMap {
  return input.reduce((savedItemTags, input) => {
    let tags = input.tags;
    if (savedItemTags[input.savedItemId]) {
      tags = savedItemTags[input.savedItemId].concat(tags);
    }
    savedItemTags[input.savedItemId] = [...new Set(tags)];
    return savedItemTags;
  }, {});
}

/**
 * converts savedItemTagsMap to TagSaveAssociations list
 * @param savedItemTagsMap
 */
export function convertToTagSaveAssociations(
  savedItemTagsMap: SavedItemTagsMap,
): TagSaveAssociation[] {
  const tagSaveAssociations: TagSaveAssociation[] = [];
  for (const savedItemId in savedItemTagsMap) {
    const tags = savedItemTagsMap[savedItemId];
    for (const tag of tags) {
      tagSaveAssociations.push({
        name: tag,
        savedItemId: savedItemId,
      });
    }
  }

  return tagSaveAssociations;
}

/**
 * Lazily load an attribute from the parent object in the resolver
 * chain (if it exists), or via a dataloader function.
 * @param key The dataloader key; used for load if the requested attribute
 * does not exist on the parent in the resolver chain.
 * @param loader The dataloader method for fetching the object, minimally
 * with the requested attribute
 * @param parent The parent in the resolver chain
 * @param attr The attribute of the parent to request
 * @returns The value keyed by `attr` of the parent or fetched object.
 */
export async function lazyParentLoad<T extends object, K, A extends keyof T>(
  key: K,
  loader: DataLoader<K, T>,
  parent: T,
  attr: A,
): Promise<T[A]> {
  if (attr in parent && parent[attr] != undefined) {
    return Promise.resolve(parent[attr]);
  } else {
    const fetched = await loader.load(key);
    return fetched[attr];
  }
}

/**
 * Returns true if the object has at least one property, accessed by a
 * key in the list 'keys', with non-null data.
 * @param obj
 * @param keys
 * @returns
 */
export function atLeastOneOf<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
) {
  for (const key of keys) {
    if (obj[key] != null) return true;
  }
  return false;
}
