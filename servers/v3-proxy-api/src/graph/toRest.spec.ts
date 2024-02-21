import {
  GetSavedItemsQuery,
  GetSavedItemsByOffsetQuery,
} from '../generated/graphql/types';
import {
  convertSavedItemsToRestResponse,
  convertSavedItemsByOffsetToRestResponse,
} from './toRest';
import { RestResponse } from './types';
import {
  testV3GetResponse,
  testItemFragment,
  testSavedItemFragment,
  mockSavedItemFragment,
  seedDataRest,
  mockItemFragment,
} from './fixtures';

describe('GraphQL <> Rest convesion', () => {
  describe('convertSavedItemsToRestResponse', () => {
    it('should transform graphql savedItems response to rest response', () => {
      const graphResponse: GetSavedItemsQuery = {
        user: {
          savedItems: {
            edges: [
              {
                cursor: 'some-cursor',
                node: {
                  __typename: 'SavedItem',
                  ...testSavedItemFragment({
                    ...mockSavedItemFragment,
                    id: `id1`,
                  }),
                  item: {
                    ...testItemFragment({
                      ...mockItemFragment,
                      itemId: `id1`,
                    }),
                  },
                },
              },
              {
                cursor: 'some-cursor-2',
                node: {
                  __typename: 'SavedItem',
                  ...testSavedItemFragment({
                    ...mockSavedItemFragment,
                    id: `id2`,
                  }),
                  item: {
                    ...testItemFragment({
                      ...mockItemFragment,
                      itemId: `id2`,
                    }),
                  },
                },
              },
            ],
          },
        },
      };

      expect(convertSavedItemsToRestResponse(graphResponse)).toEqual(
        testV3GetResponse({
          ...seedDataRest,
          ids: ['id1', 'id2'],
        }),
      );
    });

    it('should not process pending items', () => {
      const graphResponse: GetSavedItemsQuery = {
        user: {
          savedItems: {
            edges: [
              {
                // all non-required fields null or undefined
                cursor: 'some-cursor',
                node: {
                  __typename: 'SavedItem',
                  ...testSavedItemFragment({
                    ...mockSavedItemFragment,
                    id: `id1`,
                  }),
                  item: {
                    __typename: 'PendingItem',
                  },
                },
              },
            ],
          },
        },
      };
      const restResponse: RestResponse = {
        cacheType: 'db',
        list: {},
      };
      expect(convertSavedItemsToRestResponse(graphResponse)).toEqual(
        restResponse,
      );
    });
  });
  describe('convertSavedItemsByOffsetToRestResponse', () => {
    it('should transform graphql savedItemsByOffset response to rest response', () => {
      const graphResponse: GetSavedItemsByOffsetQuery = {
        user: {
          savedItemsByOffset: {
            entries: [
              {
                __typename: 'SavedItem',
                ...testSavedItemFragment({
                  ...mockSavedItemFragment,
                  id: `id1`,
                }),
                item: {
                  ...testItemFragment({
                    ...mockItemFragment,
                    itemId: `id1`,
                  }),
                },
              },
              {
                __typename: 'SavedItem',
                ...testSavedItemFragment({
                  ...mockSavedItemFragment,
                  id: `id2`,
                }),
                item: {
                  ...testItemFragment({
                    ...mockItemFragment,
                    itemId: `id2`,
                  }),
                },
              },
            ],
          },
        },
      };

      expect(convertSavedItemsByOffsetToRestResponse(graphResponse)).toEqual(
        testV3GetResponse({
          ...seedDataRest,
          ids: ['id1', 'id2'],
        }),
      );
    });

    it('should not process pending items', () => {
      const graphResponse: GetSavedItemsByOffsetQuery = {
        user: {
          savedItemsByOffset: {
            entries: [
              {
                __typename: 'SavedItem',
                ...testSavedItemFragment({
                  ...mockSavedItemFragment,
                  id: `id1`,
                }),
                item: {
                  __typename: 'PendingItem',
                },
              },
            ],
          },
        },
      };
      const restResponse: RestResponse = {
        cacheType: 'db',
        list: {},
      };
      expect(convertSavedItemsByOffsetToRestResponse(graphResponse)).toEqual(
        restResponse,
      );
    });
  });
});
