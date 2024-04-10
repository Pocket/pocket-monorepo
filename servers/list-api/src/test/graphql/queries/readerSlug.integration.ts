import { ApolloServer } from '@apollo/server';
import { ContextManager } from '../../../server/context';
import { readClient, writeClient } from '../../../database/client';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { IntMask } from '@pocket-tools/int-mask';

describe('getPocketSaveByItemId', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date1 = new Date('2008-10-21 13:57:01');

  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const SAVE_FROM_READER = gql`
    query getSaveFromReader($slug: ID!) {
      _entities(
        representations: { slug: $slug, __typename: "ReaderViewResult" }
      ) {
        ... on ReaderViewResult {
          slug
          savedItem {
            id
            url
            title
            status
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

  afterEach(() => jest.restoreAllMocks());

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
    await writeDb('list').truncate();
    await writeDb('list').insert([
      {
        api_id: '012',
        api_id_updated: '012',
        favorite: 0,
        given_url: 'https://www.youtube.com/watch?v=ECMMct_jnEM',
        item_id: 55,
        resolved_id: 55,
        status: 0,
        time_added: date1,
        time_favorited: '0000-00-00 00:00:00',
        time_read: '0000-00-00 00:00:00',
        time_updated: date1,
        title: 'How to WIN with the London System!',
        user_id: 1,
      },
    ]);
  });

  it('should return pocket save referenced by reader slug', async () => {
    jest.spyOn(IntMask, 'decode').mockReturnValueOnce(55);
    const variables = {
      slug: 'aninscrutableid',
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_FROM_READER),
        variables,
      });
    const expected = {
      slug: 'aninscrutableid',
      savedItem: {
        id: '55',
        url: 'https://www.youtube.com/watch?v=ECMMct_jnEM',
        title: 'How to WIN with the London System!',
        status: 'UNREAD',
      },
    };
    expect(res.body.data._entities[0]).toEqual(expected);
  });
  it(`should return null if the save does not exist in the user's list`, async () => {
    jest.spyOn(IntMask, 'decode').mockReturnValueOnce(1999999);
    const variables = {
      slug: 'aninscrutableid',
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_FROM_READER),
        variables,
      });
    const expected = {
      slug: 'aninscrutableid',
      savedItem: null,
    };
    expect(res.body.data._entities[0]).toEqual(expected);
  });
  it(`should not return data if the user is not logged in`, async () => {
    jest.spyOn(IntMask, 'decode').mockReturnValueOnce(55);
    const variables = {
      slug: 'aninscrutableid',
    };

    const res = await request(app)
      .post(url)
      .send({
        query: print(SAVE_FROM_READER),
        variables,
      });
    expect(res.body.data).toBeUndefined();
    expect(res.body.errors[0].extensions.code).toEqual('UNAUTHENTICATED');
  });
});
