import { readClient, writeClient } from '../../../database/client';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import Chance from 'chance';
import { gql } from 'graphql-tag';
import { print } from 'graphql';

describe('tagsList query', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  let app: Application;
  let url: string;
  let server: ApolloServer<ContextManager>;
  const chance = new Chance();

  const tagSet = Array(8)
    .fill(0)
    .map((_) => chance.word());

  const TAGS_LIST = gql`
    query tagsList($userId: ID!, $since: ISOString) {
      _entities(representations: { id: $userId, __typename: "User" }) {
        ... on User {
          tagsList(syncSince: $since)
        }
      }
    }
  `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    await server.stop();
  });
  describe('without tags', () => {
    it('returns an empty list', async () => {
      const variables = {
        userId: '1',
      };
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(TAGS_LIST),
          variables,
        });
      const expected = {
        tagsList: [],
      };
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data._entities[0]).toEqual(expected);
    });
  });
  describe('with tags', () => {
    beforeAll(async () => {
      const tags = Array(20)
        .fill(0)
        .map((_, ix) => tagSet[ix % tagSet.length]);
      const insertTags = tags.map((tag) => ({
        user_id: 1,
        item_id: chance.natural(),
        tag,
        status: 1,
        time_added: chance.date(),
        time_updated: chance.date(),
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      }));
      await writeDb('item_tags').insert(insertTags).onConflict().ignore();
    });
    it('returns a list of all tags for a user (no syncSince)', async () => {
      const variables = {
        userId: '1',
      };
      const res = await request(app)
        .post(url)
        .set(headers)
        .send({
          query: print(TAGS_LIST),
          variables,
        });
      const expected = {
        tagsList: expect.toIncludeSameMembers(tagSet),
      };
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data._entities[0]).toEqual(expected);
    });
    describe('with syncSince', () => {
      beforeAll(async () => await writeDb('users_meta').truncate());
      afterEach(async () => await writeDb('users_meta').truncate());
      it('does not return data if tags data has not changed since syncSince', async () => {
        const variables = {
          userId: '1',
          since: new Date().toISOString(),
        };
        await writeDb('users_meta').insert({
          user_id: 1,
          property: 18,
          value: '2010-03-05 00:00:00',
        });
        const res = await request(app)
          .post(url)
          .set(headers)
          .send({
            query: print(TAGS_LIST),
            variables,
          });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data._entities[0].tagsList).toBeNull();
      });

      it('does return data if data has changed since syncSince', async () => {
        await writeDb('users_meta').insert({
          user_id: 1,
          property: 18,
          value: '2024-03-05 00:00:00',
        });
        const variables = {
          userId: '1',
          since: '2023-01-01T00:00:00.000Z',
        };
        const res = await request(app)
          .post(url)
          .set(headers)
          .send({
            query: print(TAGS_LIST),
            variables,
          });
        const expected = {
          tagsList: expect.toIncludeSameMembers(tagSet),
        };
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data._entities[0]).toEqual(expected);
      });
    });
  });
});
