import { readClient } from '../../../database/client';
import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

chai.use(chaiDateTime);

describe('tags query tests - happy path', () => {
  const db = readClient();
  const headers = { userid: '1', premium: 'true' };
  const date = new Date('2020-10-03T10:20:30.000Z');
  const date1 = new Date('2021-10-03T10:20:30.000Z');
  const date2 = new Date('2022-10-03T10:20:30.000Z');
  const date3 = new Date('2023-10-03T10:20:30.000Z');

  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  beforeAll(async () => ({ app, server, url } = await startServer(0)));

  afterAll(async () => {
    await db.destroy();
    await server.stop();
  });

  beforeEach(async () => {
    await db('list').truncate();
    await db('item_tags').truncate();
    await db('readitla_b.item_grouping').truncate();
    await db('readitla_b.grouping').truncate();

    await db('list').insert([
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
    ]);

    await db('item_tags').insert([
      {
        user_id: 1,
        item_id: 2,
        tag: 'romance',
        status: 1,
        time_added: date1,
        time_updated: null,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      },
      {
        user_id: 1,
        item_id: 2,
        tag: 'horror',
        status: 1,
        time_added: date,
        time_updated: date,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      },
      {
        user_id: 1,
        item_id: 2,
        tag: 'thriller',
        status: 1,
        time_added: date2,
        time_updated: null,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      },
      {
        user_id: 1,
        item_id: 2,
        tag: 'adventure',
        status: 1,
        time_added: date3,
        time_updated: null,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      },
    ]);
  });

  describe('suggestedTags', () => {
    const variables = {
      userId: '1',
      itemId: '1',
    };

    const GET_SUGGESTED_TAGS = `
      query getSavedItem($userId: ID!, $itemId: ID!) {
        _entities(representations: { id: $userId, __typename: "User" }) {
          ... on User {
            savedItemById(id: $itemId) {
              suggestedTags {
                ... on Tag {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `;
    it('should return the 3 most recently used tags', async () => {
      const res = await request(app).post(url).set(headers).send({
        query: GET_SUGGESTED_TAGS,
        variables,
      });
      const tags = res.body.data?._entities[0].savedItemById.suggestedTags;
      expect(tags.length).to.equal(3);
      expect(tags[0].name).to.equal('adventure');
      expect(tags[1].name).to.equal('romance');
      expect(tags[2].name).to.equal('thriller');
    });
    it('should return 3 tags even if the most recent contained duplicates', async () => {
      await db('item_tags').insert({
        user_id: 1,
        item_id: 3,
        tag: 'adventure',
        status: 1,
        time_added: date3,
        time_updated: date3,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      });

      const res = await request(app).post(url).set(headers).send({
        query: GET_SUGGESTED_TAGS,
        variables,
      });
      const tags = res.body.data?._entities[0].savedItemById.suggestedTags;
      expect(tags.length).to.equal(3);
      expect(tags[0].name).to.equal('adventure');
      expect(tags[1].name).to.equal('romance');
      expect(tags[2].name).to.equal('thriller');
    });
    it('returns empty array if no tags', async () => {
      await db('item_tags').truncate();
      const res = await request(app).post(url).set(headers).send({
        query: GET_SUGGESTED_TAGS,
        variables,
      });
      const tags = res.body.data?._entities[0].savedItemById.suggestedTags;
      expect(tags.length).to.equal(0);
    });

    it('returns fewer than 3 tags if fewer than 3 are available', async () => {
      await db('item_tags').truncate();
      await db('item_tags').insert([
        {
          user_id: 1,
          item_id: 2,
          tag: 'romance',
          status: 1,
          time_added: date1,
          time_updated: date1,
          api_id: 'apiid',
          api_id_updated: 'updated_api_id',
        },
      ]);
      const res = await request(app).post(url).set(headers).send({
        query: GET_SUGGESTED_TAGS,
        variables,
      });
      const tags = res.body.data?._entities[0].savedItemById.suggestedTags;
      expect(tags.length).to.equal(1);
      expect(tags[0].name).to.equal('romance');
    });
    it('should exclude any tags on the SavedItem getting suggested tags for', async () => {
      await db('item_tags').insert({
        user_id: 1,
        item_id: 1,
        tag: 'adventure',
        status: 1,
        time_added: date3,
        time_updated: date3,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      });
      const res = await request(app).post(url).set(headers).send({
        query: GET_SUGGESTED_TAGS,
        variables,
      });
      const tags = res.body.data?._entities[0].savedItemById.suggestedTags;
      expect(tags.length).to.equal(3);
      expect(tags[0].name).to.equal('horror');
      expect(tags[1].name).to.equal('romance');
      expect(tags[2].name).to.equal('thriller');
    });

    it('should get time_updated from list table if item_tags time_updated is null', async () => {
      await db('item_tags').truncate();
      //add items in list tables so we can join on null time_updated
      await db('list').insert([
        {
          user_id: 1,
          item_id: 10,
          resolved_id: 10,
          given_url: 'http://def',
          title: 'Sample Title',
          time_added: date3,
          time_updated: date3,
          time_read: date3,
          time_favorited: date3,
          api_id: 'apiid',
          status: 1,
          favorite: 1,
          api_id_updated: 'apiid',
        },
      ]);

      await db('item_tags').insert([
        {
          user_id: 1,
          item_id: 11,
          tag: 'tag A',
          status: 1,
          time_added: date2,
          time_updated: date2,
          api_id: 'apiid',
          api_id_updated: 'updated_api_id',
        },
        {
          user_id: 1,
          item_id: 12,
          tag: 'tag B',
          status: 1,
          time_added: date1,
          time_updated: date1,
          api_id: 'apiid',
          api_id_updated: 'updated_api_id',
        },
        {
          user_id: 1,
          item_id: 1,
          tag: 'tag C',
          status: 1,
          time_added: date,
          time_updated: date,
          api_id: 'apiid',
          api_id_updated: 'updated_api_id',
        },
        {
          user_id: 1,
          item_id: 10,
          tag: 'null date',
          status: 1,
          time_added: null,
          time_updated: null,
          api_id: 'apiid',
          api_id_updated: 'updated_api_id',
        },
      ]);

      const res = await request(app).post(url).set(headers).send({
        query: GET_SUGGESTED_TAGS,
        variables,
      });

      const tags = res.body.data?._entities[0].savedItemById.suggestedTags;
      expect(tags.length).to.equal(3);
      //tagC is not in top 3 as it has the lowest time_updated
      //null date tag will get its time_updated from list table.
      expect(tags[0].name).to.equal('null date');
      expect(tags[1].name).to.equal('tag A');
      expect(tags[2].name).to.equal('tag B');
    });
  });
});
