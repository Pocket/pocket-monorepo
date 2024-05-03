import {
  getItemIdFromResolvedId,
  generateResolvedIdToItemIdMap,
  ResolvedIdToItemIdHash,
  ItemIdResolvedIdPair,
} from './itemIdUtil.js';

describe('itemIdUtil', () => {
  describe('getItemIdFromResolvedId', () => {
    const hash: ResolvedIdToItemIdHash = {
      111: 221,
      112: 222,
    };

    it('should return the item id for the given resolved id', () => {
      expect(getItemIdFromResolvedId(112, hash)).toBe(222);
    });

    it('should return null when the resolved id is not in the hash', () => {
      expect(getItemIdFromResolvedId(113, hash)).toBeNull();
    });
  });

  describe('generateResolvedIdToItemIdMap', () => {
    const pairs: ItemIdResolvedIdPair[] = [
      {
        itemId: 221,
        resolvedId: 111,
      },
      {
        itemId: 222,
        resolvedId: 112,
      },
      {
        itemId: 223,
        resolvedId: 0,
      },
    ];

    const expected = {
      111: 221,
      112: 222,
    };

    expect(generateResolvedIdToItemIdMap(pairs)).toEqual(
      expect.objectContaining(expected),
    );
  });
});
