import { GetSavedItemsByOffsetSimpleQuery } from '../generated/graphql/types';
import { savedItemsCompleteToRest, savedItemsSimpleToRest } from './toRest';
import { RestResponseSimple } from './types';
import {
  testV3GetResponse,
  testItemFragment,
  testSavedItemFragment,
  mockSavedItemFragment,
  seedDataRest,
  mockItemFragment,
  mockGraphGetComplete,
  expectedGetComplete,
} from '../test/fixtures';

describe('GraphQL <> Rest convesion', () => {
  describe('convertSavedItemsSimple', () => {
    it('should transform graphql savedItemsByOffset response to rest response', () => {
      // TODO: Remove these function layers and use explicit data to
      // avoid bugs due to expected data referencing fixture directly
      const graphResponse: GetSavedItemsByOffsetSimpleQuery = {
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

      expect(savedItemsSimpleToRest(graphResponse)).toEqual(
        testV3GetResponse({
          ...seedDataRest,
          ids: ['id1', 'id2'],
        }),
      );
    });

    it('should return defaults for pending items', () => {
      const graphResponse: GetSavedItemsByOffsetSimpleQuery = {
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
      const {
        favorite,
        time_added,
        time_favorited,
        time_read,
        time_updated,
        status,
      } = seedDataRest;
      const restResponse: RestResponseSimple = {
        cacheType: 'db',
        list: {
          id1: {
            favorite,
            time_added,
            time_favorited,
            time_read,
            time_updated,
            status,
            excerpt: '',
            given_title: '',
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
  });
  describe('convertSavedItemsComplete', () => {
    it('should transform graphql savedItemsByOffset response to rest response', () => {
      const res = savedItemsCompleteToRest(mockGraphGetComplete);
      expect(res).toEqual(expectedGetComplete);
    });
  });
});
