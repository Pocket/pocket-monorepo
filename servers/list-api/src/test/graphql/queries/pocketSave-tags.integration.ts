import { readClient, writeClient } from '../../../database/client';
import { startServer } from '../../../server/apollo';
import { ContextManager } from '../../../server/context';
import { ApolloServer } from '@apollo/server';
import { Express } from 'express';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import sinon from 'sinon';
import { TagDataService } from '../../../dataService';

describe('pocketSave.tags', () => {
  // proxy for testing we're using dataloader => batch queries
  const dbBatchSpy = sinon.spy(
    TagDataService.prototype,
    'batchGetTagsByUserItems',
  );
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30');
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const GET_POCKET_SAVE_TAGS = gql`
    query saveById($userId: ID!, $itemIds: [ID!]!) {
      _entities(representations: { id: $userId, __typename: "User" }) {
        ... on User {
          saveById(ids: $itemIds) {
            ... on PocketSave {
              tags {
                name
                id
                _deletedAt
              }
            }
          }
        }
      }
    }
  `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
    const listDatabase = {
      user_id: 1,
      title: 'mytitle',
      time_added: date,
      time_updated: date,
      time_read: date,
      time_favorited: date,
      api_id: 'apiid',
      status: 0,
      favorite: 0,
      api_id_updated: 'apiid',
    };
    const tagsDatabase = {
      user_id: 1,
      status: 1,
      time_added: date,
      time_updated: date,
      api_id: 'apiid',
      api_id_updated: 'apiid',
    };
    await writeDb('list').insert([
      {
        ...listDatabase,
        item_id: 1,
        resolved_id: 1,
        given_url: 'http://abc',
      },
      {
        ...listDatabase,
        item_id: 2,
        resolved_id: 2,
        given_url: 'http://def',
      },
    ]);
    await writeDb('item_tags').insert([
      {
        ...tagsDatabase,
        item_id: 1,
        tag: 'tobio',
      },
      {
        ...tagsDatabase,
        item_id: 1,
        tag: 'shoyo',
      },
    ]);
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    sinon.restore();
    await server.stop();
  });

  afterEach(() => sinon.resetHistory());

  it('resolves one or more tags on a save', async () => {
    const variables = {
      userId: '1',
      itemIds: ['1'],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE_TAGS),
        variables,
      });
    expect(dbBatchSpy.callCount).toEqual(1);
    expect(res.body.errors).toBeUndefined();
    const tags = res.body.data?._entities[0].saveById[0].tags;
    const expectedTags = [
      // for id, just check that we have a string with at least one character
      // this test doesn't care so much about the specific generated id
      // (covered elsewhere)
      { name: 'tobio', _deletedAt: null, id: expect.stringMatching(/.+/) },
      { name: 'shoyo', _deletedAt: null, id: expect.stringMatching(/.+/) },
    ];
    expect(tags).not.toBeUndefined();
    expect(tags).toBeArrayOfSize(2);
    expect(tags).toIncludeSameMembers(expectedTags);
  });

  it('returns an empty array if no tags on a save, with no errors', async () => {
    const variables = {
      userId: '1',
      itemIds: ['2'],
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_POCKET_SAVE_TAGS),
        variables,
      });
    expect(dbBatchSpy.callCount).toEqual(1);
    expect(res.body.errors).toBeUndefined();
    const tags = res.body.data?._entities[0].saveById[0].tags;
    expect(tags).not.toBeUndefined();
    expect(tags).toBeArrayOfSize(0);
  });
});
