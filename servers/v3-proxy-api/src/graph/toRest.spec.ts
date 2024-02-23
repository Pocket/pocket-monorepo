import {
  GetSavedItemsByOffsetSimpleQuery,
  GetSavedItemsByOffsetCompleteQuery,
} from '../generated/graphql/types';
import { savedItemsSimpleToRest } from './toRest';
import { RestResponseSimple } from './types';
import {
  testV3GetResponse,
  testItemFragment,
  testSavedItemFragment,
  mockSavedItemFragment,
  seedDataRest,
  mockItemFragment,
} from './fixtures';

describe('GraphQL <> Rest convesion', () => {
  describe('convertSavedItemsSimple', () => {
    it('should transform graphql savedItemsByOffset response to rest response', () => {
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
            amp_url: '',
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
            title: '',
            top_image_url: '',
            word_count: '0',
          },
        },
      };
      expect(savedItemsSimpleToRest(graphResponse)).toEqual(restResponse);
    });
  });
  describe('convertSavedItemsComplete', () => {
    const graphResponse: GetSavedItemsByOffsetCompleteQuery = {
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
});
