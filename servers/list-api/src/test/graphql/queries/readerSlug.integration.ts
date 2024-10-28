import { ApolloServer } from '@apollo/server';
import { ContextManager } from '../../../server/context';
import { readClient, writeClient } from '../../../database/client';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { createReaderSlug } from '@pocket-tools/int-mask';

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
    const variables = {
      slug: createReaderSlug('55'),
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_FROM_READER),
        variables,
      });
    const expected = {
      slug: createReaderSlug('55'),
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
    const variables = {
      slug: createReaderSlug('1999999'),
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVE_FROM_READER),
        variables,
      });
    const expected = {
      slug: createReaderSlug('1999999'),
      savedItem: null,
    };
    expect(res.body.data._entities[0]).toEqual(expected);
  });
});
