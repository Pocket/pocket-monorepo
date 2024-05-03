import { readClient, writeClient } from '../../../database/client.js';
import config from '../../../config/index.js';
import { ContextManager } from '../../../server/context.js';
import { startServer } from '../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import { TagDataService } from '../../../dataService/index.js';

const toBeStringOfLengthGreaterThanOne = () => expect.stringMatching(/.+/);

describe('tags query tests - happy path', () => {
  // proxy for testing we're using dataloader => batch queries
  const dbBatchSpy = jest
    .spyOn(TagDataService.prototype, 'batchGetTagsByUserItems')
    .mockClear();
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1', premium: 'true' };
  const date = new Date('2020-10-03T10:20:30.000Z');
  const date1 = new Date('2021-10-03T10:20:30.000Z');
  const date2 = new Date('2022-10-03T10:20:30.000Z');
  const date3 = new Date('2023-10-03T10:20:30.000Z');
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_TAG_CONNECTION = gql`
    query getTags($id: ID!, $pagination: PaginationInput) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          tags(pagination: $pagination) {
            edges {
              cursor
              node {
                id
                name
                _deletedAt
                _version
              }
            }
            pageInfo {
              startCursor
              endCursor
              hasNextPage
              hasPreviousPage
            }
            totalCount
          }
        }
      }
    }
  `;

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    await server.stop();
  });

  afterEach(() => jest.clearAllMocks());

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
    await writeDb('readitla_b.item_grouping').truncate();
    await writeDb('readitla_b.grouping').truncate();

    await writeDb('list').insert([
      {
        user_id: 1,
        item_id: 1,
        resolved_id: 1,
        given_url: 'http://abc',
        title: 'mytitle',
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 1,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 2,
        resolved_id: 2,
        given_url: 'http://tagtest',
        title: 'tagstest',
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date1,
        api_id: '0',
        status: 0,
        favorite: 1,
        api_id_updated: '0',
      },
      {
        user_id: 1,
        item_id: 3,
        resolved_id: 3,
        given_url: 'http://winter.sports',
        title: 'winter sports',
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date2,
        api_id: '0',
        status: 1,
        favorite: 1,
        api_id_updated: '0',
      },
      {
        user_id: 1,
        item_id: 4,
        resolved_id: 4,
        given_url: 'http://summer.sports',
        title: 'summer sports',
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date3,
        api_id: '0',
        status: 1,
        favorite: 1,
        api_id_updated: '0',
      },
      {
        user_id: 2,
        item_id: 99,
        resolved_id: 99,
        given_url: 'http://fall.sports',
        title: 'fall sports',
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date3,
        api_id: '0',
        status: 1,
        favorite: 1,
        api_id_updated: '0',
      },
    ]);

    const baseTagData = {
      status: 1,
      api_id: 'apiid',
      api_id_updated: 'updated_api_id',
    };
    const tagInserts = [
      {
        user_id: 2,
        item_id: 99,
        tag: '',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 2,
        tag: 'adventure',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 2,
        item_id: 2,
        tag: 'dontfetch',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 3,
        tag: 'adventure',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 4,
        tag: 'adventure',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 5,
        tag: 'adventure',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 6,
        tag: 'adventure',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },

      {
        user_id: 1,
        item_id: 7,
        tag: 'adventure',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 1,
        tag: 'travel',
        time_added: date,
        time_updated: date,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 2,
        tag: 'travel',
        time_added: date1,
        time_updated: date1,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 3,
        tag: 'travel',
        time_added: date1,
        time_updated: date1,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 4,
        tag: 'travel',
        time_added: date1,
        time_updated: date1,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 5,
        tag: 'travel',
        time_added: date1,
        time_updated: date1,
        ...baseTagData,
      },
      {
        user_id: 1,
        item_id: 1,
        tag: 'zebra',
        time_added: date1,
        time_updated: date1,
        ...baseTagData,
      },
    ];

    await writeDb('item_tags').insert(tagInserts);
  });

  const GET_TAGS_FOR_SAVED_ITEM = gql`
    query getSavedItem($userId: ID!, $itemId: ID!) {
      _entities(representations: { id: $userId, __typename: "User" }) {
        ... on User {
          savedItemById(id: $itemId) {
            url
            tags {
              ... on Tag {
                id
                name
                _version
                _deletedAt
                savedItems {
                  edges {
                    cursor
                    node {
                      url
                      item {
                        ... on Item {
                          givenUrl
                        }
                      }
                    }
                  }
                  pageInfo {
                    startCursor
                    endCursor
                    hasNextPage
                    hasPreviousPage
                  }
                  totalCount
                }
              }
            }
          }
        }
      }
    }
  `;

  const GET_TAGS_SAVED_ITEMS = gql`
    query getTags(
      $id: ID!
      $pagination: PaginationInput
      $itemPagination: PaginationInput
      $filter: SavedItemsFilter
      $sort: SavedItemsSort
    ) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          tags(pagination: $pagination) {
            edges {
              cursor
              node {
                id
                name
                savedItems(
                  pagination: $itemPagination
                  filter: $filter
                  sort: $sort
                ) {
                  edges {
                    cursor
                    node {
                      url
                      item {
                        ... on Item {
                          givenUrl
                        }
                      }
                    }
                  }
                  pageInfo {
                    startCursor
                    endCursor
                    hasNextPage
                    hasPreviousPage
                  }
                  totalCount
                }
              }
            }
            pageInfo {
              startCursor
              endCursor
              hasNextPage
              hasPreviousPage
            }
            totalCount
          }
        }
      }
    }
  `;

  it('return list of Tags and paginated savedItems for SavedItem', async () => {
    const variables = {
      userId: '1',
      itemId: '1',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAGS_FOR_SAVED_ITEM),
        variables,
      });
    const expected = {
      url: 'http://abc',
      tags: expect.toIncludeSameMembers([
        expect.objectContaining({
          name: 'travel',
          id: toBeStringOfLengthGreaterThanOne(),
          savedItems: expect.objectContaining({
            edges:
              // 4 saves with this tag, and one should be the parent save url
              expect.toBeArrayOfSize(4) &&
              expect.arrayContaining([
                expect.objectContaining({
                  node: expect.objectContaining({ url: 'http://abc' }),
                }),
              ]),
            totalCount: 4,
            pageInfo: expect.objectContaining({
              hasNextPage: false,
              hasPreviousPage: false,
            }),
          }),
        }),
        expect.objectContaining({
          name: 'zebra',
          id: toBeStringOfLengthGreaterThanOne(),
          savedItems: expect.objectContaining({
            edges:
              // 1 save with this tag, the element should have the parent save url
              expect.toBeArrayOfSize(1) &&
              expect.arrayContaining([
                expect.objectContaining({
                  node: expect.objectContaining({ url: 'http://abc' }),
                }),
              ]),
            totalCount: 1,
            pageInfo: expect.objectContaining({
              hasNextPage: false,
              hasPreviousPage: false,
            }),
          }),
        }),
      ]),
    };
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItemById).toMatchObject(expected);
    expect(dbBatchSpy).toHaveBeenCalledTimes(1);
  });

  describe('should not allow before/after pagination', () => {
    it('for array response', async () => {
      const variables = {
        userId: '1',
        itemId: '1',
        pagination: { before: 'emVicmFfKl8iemVicmEi', last: 10 },
      };
      const GET_PAGINATED_ITEMS = gql`
        query getSavedItem(
          $userId: ID!
          $itemId: ID!
          $pagination: PaginationInput
        ) {
          _entities(representations: { id: $userId, __typename: "User" }) {
            ... on User {
              savedItemById(id: $itemId) {
                tags {
                  ... on Tag {
                    savedItems(pagination: $pagination) {
                      totalCount
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(GET_PAGINATED_ITEMS),
          variables,
        });
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(res.body.errors[0].message).toBe(
        'Cannot specify a cursor on a nested paginated field.',
      );
      expect(dbBatchSpy).toHaveBeenCalledTimes(1);
    });

    it('under paginated Tags', async () => {
      const variables = {
        id: '1',
        pagination: { first: 2 },
        sort: { sortBy: 'CREATED_AT', sortOrder: 'ASC' },
        itemPagination: { first: 2, after: 'somecursor' },
      };
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(GET_TAGS_SAVED_ITEMS),
          variables,
        });
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(res.body.errors[0].message).toBe(
        'Cannot specify a cursor on a nested paginated field.',
      );
      // dataloader (and dependent DB functions)
      // shouldn't be called upon error at client level
      expect(dbBatchSpy).toHaveBeenCalledTimes(0);
    });
  });

  it('return list of paginated SavedItems for Tags', async () => {
    const variables = {
      id: '1',
      pagination: { first: 2 },
      sort: { sortBy: 'CREATED_AT', sortOrder: 'ASC' },
      itemPagination: { first: 2 },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAGS_SAVED_ITEMS),
        variables,
      });
    const expectedTagEdges = [
      {
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          name: 'adventure',
          savedItems: expect.objectContaining({
            totalCount: 3,
            pageInfo: expect.objectContaining({ hasNextPage: true }),
            edges: [
              expect.objectContaining({
                node: expect.objectContaining({ url: 'http://tagtest' }),
              }),
              expect.objectContaining({
                node: expect.objectContaining({ url: 'http://winter.sports' }),
              }),
            ],
          }),
        }),
      },
      {
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          name: 'travel',
          savedItems: expect.objectContaining({
            totalCount: 4,
            pageInfo: expect.objectContaining({ hasNextPage: true }),
            edges: [
              expect.objectContaining({
                node: expect.objectContaining({ url: 'http://abc' }),
              }),
              expect.objectContaining({
                node: expect.objectContaining({ url: 'http://tagtest' }),
              }),
            ],
          }),
        }),
      },
    ];
    const expected = {
      edges: expectedTagEdges,
      totalCount: 3,
      pageInfo: expect.objectContaining({ hasNextPage: true }),
    };
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0].tags).toMatchObject(expected);
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('return paginated SavedItems, when filtered by archived', async () => {
    const variables = {
      id: '1',
      pagination: { first: 1 },
      itemPagination: { last: 10 },
      sort: { sortBy: 'CREATED_AT', sortOrder: 'ASC' },
      filter: { isArchived: true },
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAGS_SAVED_ITEMS),
        variables,
      });
    const expected = {
      tags: expect.objectContaining({
        totalCount: 3,
        pageInfo: expect.objectContaining({
          hasNextPage: true,
          hasPreviousPage: false,
        }),
        edges: [
          expect.objectContaining({
            node: expect.objectContaining({
              name: 'adventure',
              savedItems: {
                totalCount: 2,
                pageInfo: expect.objectContaining({
                  hasNextPage: false,
                  hasPreviousPage: false,
                }),
                edges: [
                  expect.objectContaining({
                    node: expect.objectContaining({
                      url: 'http://winter.sports',
                    }),
                  }),
                  expect.objectContaining({
                    node: expect.objectContaining({
                      url: 'http://summer.sports',
                    }),
                  }),
                ],
              },
            }),
          }),
        ],
      }),
    };
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0]).toMatchObject(expected);
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('should return list of Tags for User for the first n values', async () => {
    const variables = {
      id: '1',
      pagination: { first: 2 },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAG_CONNECTION),
        variables,
      });
    const expectedConnection = {
      totalCount: 3,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
      },
      edges: expect.toBeArrayOfSize(2),
    };
    const edges = [
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'adventure',
        }),
      }),
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'travel',
        }),
      }),
    ];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0].tags).toMatchObject(expectedConnection);
    expect(res.body.data?._entities[0].tags.edges).toStrictEqual(edges);
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('should return list of Tags for User for last n values', async () => {
    const variables = {
      id: '1',
      pagination: { last: 2 },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAG_CONNECTION),
        variables,
      });
    const expectedConnection = {
      totalCount: 3,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
      edges: expect.toBeArrayOfSize(2),
    };
    const edges = [
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'travel',
        }),
      }),
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'zebra',
        }),
      }),
    ];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0].tags).toMatchObject(expectedConnection);
    expect(res.body.data?._entities[0].tags.edges).toStrictEqual(edges);
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('should return list of Tags for first n values after the given cursor', async () => {
    const variables = {
      id: '1',
      pagination: { first: 2, after: 'YWR2ZW50dXJlXypfOA==' },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAG_CONNECTION),
        variables,
      });
    const expectedConnection = {
      totalCount: 3,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
      edges: expect.toBeArrayOfSize(2),
    };
    const edges = [
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'travel',
        }),
      }),
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'zebra',
        }),
      }),
    ];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0].tags).toMatchObject(expectedConnection);
    expect(res.body.data?._entities[0].tags.edges).toStrictEqual(edges);
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('should return list of Tags for User for last n values before the given cursor', async () => {
    const variables = {
      id: '1',
      pagination: { last: 2, before: 'emVicmFfKl8xNA==' },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAG_CONNECTION),
        variables,
      });
    const expectedConnection = {
      totalCount: 3,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
      },
      edges: expect.toBeArrayOfSize(2),
    };
    const edges = [
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'adventure',
        }),
      }),
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'travel',
        }),
      }),
    ];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0].tags).toMatchObject(expectedConnection);
    expect(res.body.data?._entities[0].tags.edges).toStrictEqual(edges);
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('should not overflow when first is greater than available item', async () => {
    const variables = {
      id: '1',
      pagination: { first: 2, after: 'dHJhdmVsXypfMTM=' },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAG_CONNECTION),
        variables,
      });
    const expectedConnection = {
      totalCount: 3,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
      edges: expect.toBeArrayOfSize(1),
    };
    const edges = [
      expect.objectContaining({
        cursor: toBeStringOfLengthGreaterThanOne(),
        node: expect.objectContaining({
          id: toBeStringOfLengthGreaterThanOne(),
          name: 'zebra',
        }),
      }),
    ];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0].tags).toMatchObject(expectedConnection);
    expect(res.body.data?._entities[0].tags.edges).toStrictEqual(edges);
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('should resolve tag fields from the parent if provided', async () => {
    const variables = {
      id: '1',
      pagination: { first: 2 },
    };
    await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_TAG_CONNECTION),
        variables,
      });
    // tags (paginated) on a User parent hasn't been setup with dataloaders yet
    expect(dbBatchSpy).toHaveBeenCalledTimes(0);
  });

  it('should allow returning empty tags', async () => {
    const variables = {
      userId: '2',
      itemId: '99',
    };
    const res = await request(app)
      .post(url)
      .set({ ...headers, userid: '2' })
      .send({
        query: print(GET_TAGS_FOR_SAVED_ITEM),
        variables,
      });
    const expected = {
      savedItemById: expect.objectContaining({
        url: 'http://fall.sports',
        tags: [
          expect.objectContaining({
            name: '',
            id: Buffer.from(config.data.tagIdSuffix).toString('base64'),
          }),
        ],
      }),
    };
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0]).toMatchObject(expected);
    expect(dbBatchSpy).toHaveBeenCalledTimes(1);
  });
});
