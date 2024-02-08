import { GetSavedItemsQuery } from '../generated/graphql/types';
import { convertSavedItemsToRestResponse } from './toRest';
import { RestResponse } from './types';
import {
  testV3GetResponse,
  testItemFragment,
  testSavedItemFragment,
  mockSavedItemFragment,
  seedDataRest,
  mockItemFragment,
} from './fixtures';

describe('convertSavedItemsToRestResponse', () => {
  it('should transform graphql response to rest response', () => {
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
