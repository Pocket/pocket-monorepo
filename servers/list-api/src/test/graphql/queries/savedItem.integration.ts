import { readClient, writeClient } from '../../../database/client';
import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import { getUnixTimestamp } from '../../../utils';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
chai.use(chaiDateTime);

describe('getSavedItemByItemId', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const unixDate = getUnixTimestamp(date); // unix timestamp
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const unixDate1 = getUnixTimestamp(date1); // unix timestamp
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_SAVED_ITEM = `
    query getSavedItem($userId: ID!, $itemId: ID!) {
      _entities(representations: { id: $userId, __typename: "User" }) {
        ... on User {
          savedItemById(id: $itemId) {
            id
            url
            isFavorite
            isArchived
            favoritedAt
            archivedAt
            status
            _createdAt
            _updatedAt
            _deletedAt
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
        user_id: 1,
        item_id: 2,
        resolved_id: 2,
        given_url: 'http://def',
        title: 'title2',
        time_added: date,
        time_updated: date1,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 2,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 3,
        resolved_id: 3,
        given_url: 'http://ijk',
        title: 'title3',
        time_added: date,
        time_updated: date1,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 1,
        favorite: 1,
        api_id_updated: 'apiid',
      },
    ]);
  });

  it('should return a saved item with all appropriate fields', async () => {
    const variables = {
      userId: '1',
      itemId: '1',
    };

    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM,
      variables,
    });
    expect(res.body.data?._entities[0].savedItemById.url).to.equal(
      'http://abc',
    );
    expect(res.body.data?._entities[0].savedItemById.id).to.equal('1');
    expect(res.body.data?._entities[0].savedItemById.favoritedAt).to.equal(
      unixDate,
    );
    expect(res.body.data?._entities[0].savedItemById.isFavorite).to.equal(true);
    expect(res.body.data?._entities[0].savedItemById.status).to.equal('UNREAD');
    expect(res.body.data?._entities[0].savedItemById._createdAt).to.equal(
      unixDate,
    );
    expect(res.body.data?._entities[0].savedItemById._updatedAt).to.equal(
      unixDate1,
    );
    expect(res.body.data?._entities[0].savedItemById._deletedAt).to.be.null;
  });

  it('should return null if no item is found for the user', async () => {
    const variables = {
      userId: '1',
      itemId: '10',
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM,
      variables,
    });
    expect(res.body.data?._entities[0].savedItemById).to.be.null;
  });
  it('should resolve item url', async () => {
    const variables = {
      userId: '1',
      itemId: '1',
    };
    const GET_SAVED_ITEM_ITEM = `
      query getSavedItem($userId: ID!, $itemId: ID!) {
        _entities(representations: { id: $userId, __typename: "User" }) {
          ... on User {
            savedItemById(id: $itemId) {
              id
              url
              isFavorite
              favoritedAt
              item {
                ... on Item {
                  givenUrl
                }
              }
            }
          }
        }
      }
    `;
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM_ITEM,
      variables,
    });
    expect(res.body.data?._entities[0].savedItemById.item.givenUrl).to.equal(
      'http://abc',
    );
  });

  it('should have _deletedAt field if item is deleted', async () => {
    const variables = {
      userId: '1',
      itemId: '2',
    };
    const res = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM,
      variables,
    });
    expect(res.body.data?._entities[0].savedItemById._deletedAt).to.equal(
      unixDate1,
    );
  });

  it('should resolve isArchived properly', async () => {
    const archivedVars = {
      userId: '1',
      itemId: '3',
    };
    const nonArchivedVars = {
      userId: '1',
      itemId: '2',
    };
    const archivedRes = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM,
      variables: archivedVars,
    });
    const nonArchivedRes = await request(app).post(url).set(headers).send({
      query: GET_SAVED_ITEM,
      variables: nonArchivedVars,
    });
    expect(
      archivedRes.body.data?._entities[0].savedItemById.isArchived,
    ).to.equal(true);
    expect(
      archivedRes.body.data?._entities[0].savedItemById.archivedAt,
    ).to.equal(getUnixTimestamp(date));
    expect(
      nonArchivedRes.body.data?._entities[0].savedItemById.isArchived,
    ).to.equal(false);
    expect(nonArchivedRes.body.data?._entities[0].savedItemById.archivedAt).to
      .be.null;
  });
});
