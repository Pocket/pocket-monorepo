import { SavedItemsSimpleQuery } from '../../generated/graphql/types';
import {
  savedItemsCompleteToRest,
  savedItemsCompleteTotalToRest,
  savedItemsSimpleToRest,
  savedItemsSimpleTotalToRest,
  searchSavedItemSimpleToRest,
  searchSavedItemCompleteToRest,
  savedItemsFetchToRest,
  savedItemsFetchSharesToRest,
} from './toRest';
import { GetResponseSimple } from '../types';
import {
  testV3GetResponse,
  testItemFragment,
  testSavedItemFragment,
  mockSavedItemFragment,
  seedDataRest,
  mockItemFragment,
  mockGraphGetComplete,
  expectedGetComplete,
  expectedGetCompleteTotal,
  mockGraphGetSimple,
  expectedGetSimpleTotal,
  premiumSearchGraphSimple,
  freeTierSearchGraphSimple,
  expectedFreeTierResponseSimple,
  freeTierSearchGraphComplete,
  expectedFreeTierResponseComplete,
  premiumSearchGraphComplete,
  graphSearchNoResults,
  expectedFreeTierSearchNoResults,
  expectedPremiumTierResponseSimple,
  expectedPremiumTierResponseComplete,
  expectedFetch,
  mockGraphGetSimpleTitle,
  expectedGetSimpleTitle,
  expectedSharesFetch,
} from '../../test/fixtures';

describe('GraphQL <> Rest convesion', () => {
  describe('convertSavedItemsSimple', () => {
    it('should transform graphql savedItemsByOffset response to rest response', () => {
      // TODO: Remove these function layers and use explicit data to
      // avoid bugs due to expected data referencing fixture directly
      const graphResponse: SavedItemsSimpleQuery = {
        user: {
          savedItemsByOffset: {
            totalCount: 10,
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

      expect(savedItemsSimpleToRest(graphResponse)).toEqual(
        testV3GetResponse({
          ...seedDataRest,
          ids: ['id1', 'id2'],
        }),
      );
    });

    it('should return defaults for pending items', () => {
      const graphResponse: SavedItemsSimpleQuery = {
        user: {
          savedItemsByOffset: {
            totalCount: 10,
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
      const {
        favorite,
        time_added,
        time_favorited,
        time_read,
        time_updated,
        status,
      } = seedDataRest;
      const restResponse: GetResponseSimple = {
        cachetype: 'db',
        maxActions: 30,
        status: 1,
        complete: 1,
        since: 1677818995,
        error: null,
        list: {
          id1: {
            favorite,
            time_added,
            time_favorited,
            time_read,
            time_updated,
            status,
            excerpt: '',
            given_title: 'given title',
            given_url: '',
            has_image: '0',
            has_video: '0',
            is_article: '0',
            is_index: '0',
            item_id: 'id1',
            time_to_read: 0,
            lang: '',
            listen_duration_estimate: 0,
            resolved_id: '',
            resolved_title: '',
            resolved_url: '',
            sort_id: 0,
            word_count: '0',
          },
        },
      };
      expect(savedItemsSimpleToRest(graphResponse)).toEqual(restResponse);
    });
    it('works for adding the "total" field', () => {
      const res = savedItemsSimpleTotalToRest(mockGraphGetSimple);
      expect(res).toEqual(expectedGetSimpleTotal);
    });
    it('uses user-provider title if provided, and falls back to parser-provided title if not', () => {
      const res = savedItemsSimpleToRest(mockGraphGetSimpleTitle);
      expect(res).toEqual(expectedGetSimpleTitle);
    });
  });
  describe('convertSavedItemsComplete', () => {
    it('should transform graphql savedItemsByOffset response to rest response', () => {
      const res = savedItemsCompleteToRest(mockGraphGetComplete);
      expect(res).toEqual(expectedGetComplete);
    });
    it('works for adding the "total" field', () => {
      const res = savedItemsCompleteTotalToRest(mockGraphGetComplete);
      expect(res).toEqual(expectedGetCompleteTotal);
    });
  });
  describe('convertSearchSavedItemSimple', () => {
    it('works for search response with results (free tier, simple)', () => {
      const res = searchSavedItemSimpleToRest(freeTierSearchGraphSimple);
      expect(res).toEqual(expectedFreeTierResponseSimple);
    });
    it('works for search response with results (free tier, complete)', () => {
      const res = searchSavedItemCompleteToRest(freeTierSearchGraphComplete);
      expect(res).toEqual(expectedFreeTierResponseComplete);
    });
    it('works for search response with results (premium tier, simple)', () => {
      const res = searchSavedItemSimpleToRest(premiumSearchGraphSimple);
      expect(res).toEqual(expectedPremiumTierResponseSimple);
    });
    it('works for search response with results (premium tier, complete)', () => {
      const res = searchSavedItemCompleteToRest(premiumSearchGraphComplete);
      expect(res).toEqual(expectedPremiumTierResponseComplete);
    });
    it('works with no results in response', () => {
      const resSimple = searchSavedItemSimpleToRest(graphSearchNoResults);
      const resComplete = searchSavedItemCompleteToRest(graphSearchNoResults);
      expect(resSimple).toEqual(expectedFreeTierSearchNoResults);
      expect(resComplete).toEqual(expectedFreeTierSearchNoResults);
    });
  });

  describe('convertSavedItemsFetch', () => {
    it('should transform graphql savedItemsByOffset response to fetch response', () => {
      const res = savedItemsFetchToRest(
        { chunk: '1', fetchChunkSize: '250', firstChunkSize: '25' },
        mockGraphGetComplete,
      );
      expect(res).toEqual(expectedFetch);
    });

    it('should transform graphql savedItemsByOffset response to fetch shared response', () => {
      const res = savedItemsFetchSharesToRest(
        { chunk: '1', fetchChunkSize: '250', firstChunkSize: '25' },
        mockGraphGetComplete,
      );
      expect(res).toEqual(expectedSharesFetch);
    });
  });
});
