import { PendingItemStatus } from '../types/index.js';
import { ItemModel } from './item.js';

describe('ItemModel', () => {
  describe('getBySave', () => {
    it('returns PendingItem if resolvedId is null', () => {
      const save = {
        givenUrl: 'https://www.youtube.com/watch?v=YyknBTm_YyM',
        id: '123',
        resolvedId: null,
      };
      const expected = {
        itemId: '123',
        url: 'https://www.youtube.com/watch?v=YyknBTm_YyM',
        __typename: 'PendingItem',
        status: PendingItemStatus.UNRESOLVED,
      };
      const actual = new ItemModel().getBySave(save);
      expect(actual).toStrictEqual(expected);
    });
    it('returns PendingItem if resolvedId is undefined', () => {
      const save = {
        givenUrl: 'https://www.youtube.com/watch?v=YyknBTm_YyM',
        id: '123',
        resolvedId: null,
      };
      const expected = {
        itemId: '123',
        url: 'https://www.youtube.com/watch?v=YyknBTm_YyM',
        status: PendingItemStatus.UNRESOLVED,
        __typename: 'PendingItem',
      };
      const actual = new ItemModel().getBySave(save);
      expect(actual).toStrictEqual(expected);
    });
    it('returns PendingItem if resolvedId is 0', () => {
      const save = {
        givenUrl: 'https://www.youtube.com/watch?v=YyknBTm_YyM',
        id: '123',
        resolvedId: null,
      };
      const expected = {
        itemId: '123',
        url: 'https://www.youtube.com/watch?v=YyknBTm_YyM',
        __typename: 'PendingItem',
        status: PendingItemStatus.UNRESOLVED,
      };
      const actual = new ItemModel().getBySave(save);
      expect(actual).toStrictEqual(expected);
    });
    it('returns Item if resolvedId is not null', () => {
      const savedItem = {
        url: 'https://www.youtube.com/watch?v=nsNMP6_Q0Js',
        id: '123',
        resolvedId: '123',
      };
      const expected = {
        givenUrl: 'https://www.youtube.com/watch?v=nsNMP6_Q0Js',
        itemId: '123',
        resolvedId: '123',
        __typename: 'Item',
      };
      const actual = new ItemModel().getBySave(savedItem);
      expect(actual).toStrictEqual(expected);
    });
  });
});
