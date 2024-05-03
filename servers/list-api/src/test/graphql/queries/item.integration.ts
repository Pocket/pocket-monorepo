import { readClient, writeClient } from '../../../database/client.js';
import { ContextManager } from '../../../server/context.js';
import { startServer } from '../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
describe('item', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const itemFragment = `
    fragment ItemFields on Item {
      givenUrl
      savedItem {
        id
        url
        isFavorite
        isArchived
      }
    }
  `;
  const GET_SAVED_ITEM = `
    ${itemFragment}
    query getSaveFromItem($givenUrl: String!) {
      _entities(representations: { givenUrl: $givenUrl, __typename: "Item" }) {
        ... on Item {
          ...ItemFields
        }
      }
    }
  `;
  // It was more effort to format the entity string programmatically
  // than to just duplicate it
  const GET_TWO_SAVED_ITEMS = `
    ${itemFragment}
    query getSavesFromItems($givenUrl1: String!, $givenUrl2: String!) {
      _entities(
        representations: [
          { givenUrl: $givenUrl1, __typename: "Item" }
          { givenUrl: $givenUrl2, __typename: "Item" }
        ]
      ) {
        ... on Item {
          ...ItemFields
        }
      }
    }
  `;
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await writeDb('list').truncate();
    await writeDb('list').insert([
      {
        // a valid item_url
        user_id: 1,
        item_id: 1,
        resolved_id: 1,
        given_url: 'https://www.youtube.com/watch?v=aWJ_7akYFhg',
        title: 'mytitle',
        time_added: date,
        time_updated: date1,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        // a valid item_url
        user_id: 1,
        item_id: 999,
        resolved_id: 999,
        given_url: 'https://www.youtube.com/watch?v=OZaL86RDGIU',
        title: 'mytitle2',
        time_added: date,
        time_updated: date1,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 1,
        favorite: 0,
        api_id_updated: 'apiid',
      },
      {
        // a valid item_url but not for the user
        user_id: 2,
        item_id: 2,
        resolved_id: 2,
        given_url: 'https://www.youtube.com/watch?v=Tpbo25iBvfU',
        title: 'title2',
        time_added: date,
        time_updated: date1,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
    ]);
  });
  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    await server.stop();
  });
  it('resolves more than one savedItem from multiple entities', async () => {
    const expected = [
      {
        givenUrl: 'https://www.youtube.com/watch?v=aWJ_7akYFhg',
        savedItem: {
          url: 'https://www.youtube.com/watch?v=aWJ_7akYFhg',
          isFavorite: true,
          isArchived: false,
          id: '1',
        },
      },
      {
        givenUrl: 'https://www.youtube.com/watch?v=OZaL86RDGIU',
        savedItem: {
          url: 'https://www.youtube.com/watch?v=OZaL86RDGIU',
          isFavorite: false,
          isArchived: true,
          id: '999',
        },
      },
    ];
    const variables = {
      userId: '1',
      givenUrl1: 'https://www.youtube.com/watch?v=aWJ_7akYFhg',
      givenUrl2: 'https://www.youtube.com/watch?v=OZaL86RDGIU',
    };

    const res = await request(app).post(url).set(headers).send({
      query: GET_TWO_SAVED_ITEMS,
      variables,
    });
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data).not.toBeUndefined;
    const entities = res.body.data._entities;
    expect(entities.length).toEqual(2);
    expect(entities).toEqual(expect.arrayContaining(expected));
  });
  it('resolves savedItem field from entity representation', async () => {
    const expected = {
      givenUrl: 'https://www.youtube.com/watch?v=aWJ_7akYFhg',
      savedItem: {
        url: 'https://www.youtube.com/watch?v=aWJ_7akYFhg',
        isFavorite: true,
        isArchived: false,
        id: '1',
      },
    };
    const variables = {
      userId: '1',
      givenUrl: 'https://www.youtube.com/watch?v=aWJ_7akYFhg',
    };

    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM,
      variables,
    });

    expect(res.body.errors).toBeUndefined;
    expect(res.body.data).not.toBeUndefined;
    const entities = res.body.data._entities;
    expect(entities.length).toEqual(1);
    expect(entities[0]).toEqual(expected);
  });
  it('returns null if the save does not exist', async () => {
    const variables = {
      userId: '1',
      givenUrl: 'https://www.youtube.com/watch?v=Tpbo25iBvfU',
    };

    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM,
      variables,
    });
    expect(res.body.data).not.toBeUndefined;
    expect(res.body.errors).toBeUndefined;
    const entities = res.body.data._entities;
    expect(entities.length).toEqual(1);
    expect(entities[0].givenUrl).toEqual(
      'https://www.youtube.com/watch?v=Tpbo25iBvfU',
    );
    expect(entities[0].savedItem).toBeNull;
  });
});
