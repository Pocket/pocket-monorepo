export type ItemIdResolvedIdPair = {
  itemId: number;
  resolvedId: number | null;
};

export type ResolvedIdToItemIdHash = {
  [resolvedId: number]: number;
};

/**
 * generates an array of objects where the key is a resolved id and the value is
 * the corresponding item id. used when we need to look something up
 * by resolved id (e.g. author or content) and need to map that record
 * back to the original item id
 *
 * @param itemIdResolvedIdPairs
 */
export const generateResolvedIdToItemIdMap = (
  itemIdResolvedIdPairs: ItemIdResolvedIdPair[]
): ResolvedIdToItemIdHash => {
  const hash = {};

  itemIdResolvedIdPairs.forEach((pair) => {
    // resolved id can be zero, in which case we ignore it
    if (pair.resolvedId > 0) {
      hash[pair.resolvedId] = pair.itemId;
    }
  });

  return hash;
};

/**
 *
 * @param resolvedId
 * @param resolvedIdToItemIdHash
 */
export const getItemIdFromResolvedId = (
  resolvedId: number,
  resolvedIdToItemIdHash: ResolvedIdToItemIdHash
): number | null => {
  const key = Object.keys(resolvedIdToItemIdHash).find(
    (key) => Number(key) === resolvedId
  );

  return resolvedIdToItemIdHash[key] || null;
};
