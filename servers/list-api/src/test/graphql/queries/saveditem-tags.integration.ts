import { readClient } from '../../../database/client';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import Chance from 'chance';

const range = (n: number) => Array.from({ length: n }, (_, index) => index);

describe('tags on saved items', () => {
  const chance = new Chance();
  const db = readClient();
  const userid = '1';
  const headers = { userid };
  const count = 5000;
  const startId = 39505005;

  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const seedSavesAndTag = async (tag: string) => {
    const listData = range(count).map((id) => ({
      user_id: userid,
      item_id: startId + id,
      resolved_id: id,
      given_url: chance.url(),
      title: chance.string({ length: 30 }),
      time_added: chance.date(),
      time_updated: chance.date(),
      time_read: chance.date(),
      time_favorited: chance.date(),
      favorite: 0,
      status: 0,
      api_id: '0',
      api_id_updated: '0',
    }));
    const tagData = range(count).map((id) => ({
      user_id: userid,
      item_id: startId + id,
      tag,
      time_added: chance.date(),
      time_updated: chance.date(),
      status: 1,
      api_id: '0',
      api_id_updated: '0',
    }));
    await db.batchInsert('list', listData);
    await db.batchInsert('item_tags', tagData);
  };

  const GET_SAVES = gql`
    query getSavedItemTags($representations: [_Any!]!, $savedItemByIdId: ID!) {
      _entities(representations: $representations) {
        ... on User {
          savedItemById(id: $savedItemByIdId) {
            tags {
              name
            }
          }
        }
      }
    }
  `;

  beforeAll(async () => {
    await db('list').truncate();
    await db('item_tags').truncate();
    ({ app, server, url } = await startServer(0));
    await seedSavesAndTag('recipe');
  });

  afterAll(async () => {
    await db.destroy();
    await server.stop();
  });
  it('appears on saves with a high item_id, even if applied to > 1k saves', async () => {
    const variables = {
      representations: {
        id: userid,
        __typename: 'User',
      },
      savedItemByIdId: count + startId - 1,
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(GET_SAVES),
        variables,
      });
    const expected = {
      savedItemById: {
        tags: [
          {
            name: 'recipe',
          },
        ],
      },
    };
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data?._entities[0]).toStrictEqual(expected);
  });
  describe('for multiple tags on a save', () => {
    const savedItemByIdId = count + startId - 1;
    beforeAll(async () => {
      await db('item_tags').insert({
        user_id: userid,
        item_id: savedItemByIdId,
        tag: 'tofu',
        time_added: chance.date(),
        time_updated: chance.date(),
        status: 1,
        api_id: '0',
        api_id_updated: '0',
      });
    });
    it('where tags are applied to many saves and few saves', async () => {
      const variables = {
        representations: {
          id: userid,
          __typename: 'User',
        },
        savedItemByIdId,
      };
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(GET_SAVES),
          variables,
        });
      const expected = {
        savedItemById: {
          tags: expect.toIncludeSameMembers([
            {
              name: 'recipe',
            },
            {
              name: 'tofu',
            },
          ]),
        },
      };
      expect(res.body.data.errors).toBeUndefined();
      expect(res.body.data?._entities[0]).toStrictEqual(expected);
    });
  });
});
