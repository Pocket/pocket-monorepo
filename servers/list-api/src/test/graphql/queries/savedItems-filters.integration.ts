import { readClient, writeClient } from '../../../database/client';
import { getUnixTimestamp } from '../../../utils';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('getSavedItems filter', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  // TODO: What date is the server running in? Web repo does central...
  // should this do UTC, this changes pagination cursors.
  const date1 = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date2 = new Date('2020-10-03 10:22:30'); // Consistent date for seeding
  const date2Unix = getUnixTimestamp(date2); // Consistent date for seeding
  const date3 = new Date('2020-10-03 10:25:30'); // Consistent date for seeding
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_SAVED_ITEMS = `
    query getSavedItem($id: ID!, $filter: SavedItemsFilter) {
      _entities(representations: { id: $id, __typename: "User" }) {
        ... on User {
          savedItems(pagination: { first: 30 }, filter: $filter) {
            totalCount
            pageInfo {
              startCursor
              endCursor
              hasNextPage
              hasPreviousPage
            }
            edges {
              node {
                url
                item {
                  ... on Item {
                    savedItem {
                      id
                      status
                      isFavorite
                      tags {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    await server.stop();
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    await writeDb('list').truncate();
    await writeDb('list').insert([
      {
        user_id: 1,
        item_id: 1,
        resolved_id: 1,
        given_url: 'http://abc',
        title: 'mytitle',
        time_added: date1,
        time_updated: date1,
        time_read: date1,
        time_favorited: date1,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 2,
        resolved_id: 2,
        given_url: 'http://def',
        title: 'title2',
        time_added: date2,
        time_updated: date2,
        time_read: date2,
        time_favorited: date2,
        api_id: 'apiid',
        status: 1,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 3,
        resolved_id: 3,
        given_url: 'http://ijk',
        title: 'mytitle',
        time_added: date3,
        time_updated: date3,
        time_read: date3,
        time_favorited: date3,
        api_id: 'apiid',
        status: 2,
        favorite: 0,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 4,
        resolved_id: 4,
        given_url: 'http://lmn',
        title: 'mytitle',
        time_added: date1,
        time_updated: date1,
        time_read: date1,
        time_favorited: date1,
        api_id: 'apiid',
        status: 0,
        favorite: 0,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 5,
        resolved_id: 5,
        given_url: 'http://opq',
        title: 'mytitle',
        time_added: date1,
        time_updated: date1,
        time_read: date1,
        time_favorited: date1,
        api_id: 'apiid',
        status: 0,
        favorite: 0,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 6,
        resolved_id: 6,
        given_url: 'http://rst',
        title: 'mytitle',
        time_added: date1,
        time_updated: date1,
        time_read: date1,
        time_favorited: date1,
        api_id: 'apiid',
        status: 0,
        favorite: 0,
        api_id_updated: 'apiid',
      },
    ]);

    await writeDb('item_tags').truncate();
    await writeDb('item_tags').insert([
      {
        user_id: 1,
        item_id: 1,
        tag: 'recipe',
        time_added: date1,
        time_updated: date1,
      },
      {
        user_id: 1,
        item_id: 1,
        tag: 'tofu',
        time_added: date1,
        time_updated: date1,
      },
      {
        user_id: 1,
        item_id: 2,
        tag: 'recipe',
        time_added: date1,
        time_updated: date1,
      },
    ]);
    await writeDb('user_annotations').truncate();
    await writeDb('user_annotations').insert([
      {
        user_id: 1,
        item_id: 1,
        annotation_id: 1,
        status: 1,
      },
      {
        user_id: 1,
        item_id: 1,
        annotation_id: 2,
        status: 1,
      },
      {
        user_id: 1,
        item_id: 2,
        annotation_id: 3,
        status: 0, // deleted highlight
      },
    ]);
    await writeDb.raw('TRUNCATE TABLE readitla_b.items_extended');
    await writeDb
      .insert([
        {
          extended_item_id: 1,
          image: 0,
          video: 1,
          is_article: 0,
        },
        {
          extended_item_id: 2,
          image: 0,
          video: 0,
          is_article: 1,
        },
        {
          extended_item_id: 3,
          image: 0,
          video: 0,
          is_article: 1,
        },
        {
          extended_item_id: 4,
          image: 0,
          video: 0,
          is_article: 0,
        },
        {
          extended_item_id: 5,
          image: 0,
          video: 2,
          is_article: 0,
        },
        {
          extended_item_id: 6,
          image: 2,
          video: 0,
          is_article: 0,
        },
      ])
      .into(`readitla_b.items_extended`);
  });

  it('should return untagged items', async () => {
    const variables = {
      id: '1',
      filter: { tagNames: ['_untagged_'] },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities[0].savedItems.edges.length).toBe(4);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://ijk',
    );
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.tags
        .length,
    ).toBe(0);
  });

  it('should return items with a specific tag', async () => {
    const variables = {
      id: '1',
      filter: { tagNames: ['tofu'] },
    };
    const tags = [{ name: 'tofu' }, { name: 'recipe' }];
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities[0].savedItems.edges.length).toBe(1);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://abc',
    );
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.tags
        .length,
    ).toBe(2);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.tags,
    ).toContainAllValues(tags);
  });

  it('should return items with a list of specified tags', async () => {
    const variables = {
      id: '1',
      filter: { tagNames: ['recipe', 'tofu'] },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities[0].savedItems.edges.length).toBe(2);
    const actualTags = res.body.data._entities[0].savedItems.edges.map(
      (edge) => edge.node.item.savedItem.tags,
    );
    expect(actualTags).toIncludeSameMembers([
      expect.toIncludeSameMembers([{ name: 'tofu' }, { name: 'recipe' }]),
      [{ name: 'recipe' }],
    ]);
  });

  it('should return archived items', async () => {
    const variables = {
      id: '1',
      filter: { isArchived: true },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data._entities[0].savedItems.edges[0].node.item.savedItem.status,
    ).toBe('ARCHIVED');
  });
  it('should return non-archived items', async () => {
    const variables = {
      id: '1',
      filter: { isArchived: false },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(5);
    res.body.data?._entities[0].savedItems.edges.forEach((edge) => {
      expect(edge.node.item.savedItem.status).not.toBe('ARCHIVED');
    });
  });

  it('should return items updated since a specific time', async () => {
    const variables = {
      id: '1',
      filter: { updatedSince: date2Unix },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://ijk',
    );
  });

  it('should return items updated before a specific time', async () => {
    const variables = {
      id: '1',
      filter: { updatedBefore: date2Unix },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(4);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://abc',
    );
  });

  it('should return favorited items', async () => {
    const variables = {
      id: '1',
      filter: { isFavorite: true },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(2);
    res.body.data?._entities[0].savedItems.edges.forEach((edge) => {
      expect(edge.node.item.savedItem.isFavorite).toBe(true);
    });
  });

  it('should return non-favorited items', async () => {
    const variables = {
      id: '1',
      filter: { isFavorite: false },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(4);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem
        .isFavorite,
    ).toBe(false);
  });

  it('should not throw an error if no items match the filters', async () => {
    const variables = {
      id: '1',
      filter: {
        isHighlighted: true,
        contentType: 'VIDEO',
        isFavorite: false,
        status: 'ARCHIVED',
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges).toEqual([]);
    expect(res.body.data?._entities[0].savedItems.totalCount).toBe(0);
    expect(res.body.data?._entities[0].savedItems.pageInfo).toEqual({
      startCursor: null,
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('should return highlighted items with active (non-deleted) highlights only', async () => {
    const variables = {
      id: '1',
      filter: { isHighlighted: true },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://abc',
    );
  });

  it('should return non-highlighted items (or items with only deleted highlights)', async () => {
    const variables = {
      id: '1',
      filter: { isHighlighted: false },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(5);
    res.body.data?._entities[0].savedItems.edges.forEach((edge) => {
      expect(edge.node.url).toBeOneOf([
        'http://ijk',
        'http://def',
        'http://lmn',
        'http://opq',
        'http://rst',
      ]);
    });
  });

  it('should return articles that can be opened in article view (deprecated)', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'ARTICLE' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    const edges = res.body.data?._entities[0].savedItems.edges;
    expect(edges.length).toBe(2);
    const actualIds = edges.map((edge) => edge.node.item.savedItem.id);
    expect(actualIds).toContainAllValues(['2', '3']);
  });
  it('should return articles that can be opened in article view', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'IS_READABLE' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    const edges = res.body.data?._entities[0].savedItems.edges;
    expect(edges.length).toBe(2);
    const actualIds = edges.map((edge) => edge.node.item.savedItem.id);
    expect(actualIds).toContainAllValues(['2', '3']);
  });
  it('should return articles with videos (deprecated)', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'VIDEO' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.id,
    ).toBe('1');
  });
  it('should return articles with videos', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'HAS_VIDEO' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.id,
    ).toBe('1');
  });
  it('should return videos', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'IS_VIDEO' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.id,
    ).toBe('5');
  });
  it('should return items that contain videos or are videos', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'HAS_VIDEO_INCLUSIVE' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(2);
    const ids = res.body.data?._entities[0].savedItems.edges.map(
      (edge) => edge.node.item.savedItem.id,
    );
    expect(ids).toIncludeSameMembers(['5', '1']);
  });
  it('should return images', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'IS_IMAGE' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.id,
    ).toBe('6');
  });
  it('should return articles that are un-parsable and will be opened externally', async () => {
    const variables = {
      id: '1',
      filter: { contentType: 'IS_EXTERNAL' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(2);
    res.body.data?._entities[0].savedItems.edges.forEach((edge) => {
      expect(edge.node.url).toBeOneOf(['http://abc', 'http://lmn']);
    });
  });

  it('should return items by status', async () => {
    const variables = {
      id: '1',
      filter: { status: 'ARCHIVED' },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem.id,
    ).toBe('2');
  });
  it('should use statuses to return multiple statuses', async () => {
    const variables = {
      id: '1',
      filter: { statuses: ['UNREAD', 'ARCHIVED'] },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(5);
    expect(
      res.body.data?._entities[0].savedItems.edges.map(
        (edge) => edge.node.item.savedItem.id,
      ),
    ).toContainAllValues(['1', '2', '4', '5', '6']); // Don't care about sort for this test
  });

  it('should be combined with other filters properly', async () => {
    const variables = {
      id: '1',
      filter: {
        isFavorite: true,
        updatedSince: getUnixTimestamp(new Date('2020-10-02 10:20:30')),
        isArchived: false,
        isHighlighted: true,
        tagNames: ['recipe', '_untagged_'],
      },
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?._entities[0].savedItems.edges.length).toBe(1);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem
        .isFavorite,
    ).toBe(true);
    expect(
      res.body.data?._entities[0].savedItems.edges[0].node.item.savedItem
        .status,
    ).not.toBe('ARCHIVED');
    expect(res.body.data?._entities[0].savedItems.edges[0].node.url).toBe(
      'http://abc',
    );
  });
});
