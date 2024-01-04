import { readClient } from '../../../database/client';
import chai, { expect } from 'chai';
import chaiDateTime from 'chai-datetime';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

chai.use(chaiDateTime);
chai.use(deepEqualInAnyOrder);

describe('getSavedItemsOnCuratedItem', () => {
  const db = readClient();
  const headers = { userid: '1' };

  // TODO: What date is the server running in? Web repo does central...
  // should this do UTC, this changes pagination cursors.
  const date1 = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date2 = new Date('2020-10-03 10:22:30'); // Consistent date for seeding
  const date3 = new Date('2020-10-03 10:25:30'); // Consistent date for seeding
  const nullDate = new Date('0000-00-00 00:00:00');
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
    await db('list').insert([
      {
        user_id: 1,
        item_id: 1,
        resolved_id: 1,
        given_url: 'http://abc',
        title: 'mytitle',
        time_added: date1,
        time_updated: date2,
        time_read: date1,
        time_favorited: nullDate,
        api_id: 'apiid',
        status: 1,
        favorite: 0,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 2,
        resolved_id: 2,
        given_url: 'http://def',
        title: 'title2',
        time_added: date2,
        time_updated: date3,
        time_read: date2,
        time_favorited: date2,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 3,
        resolved_id: 1,
        given_url: 'http://ijk',
        title: 'mytitle',
        time_added: date3,
        time_updated: date1,
        time_read: date3,
        time_favorited: date1,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
    ]);
  });

  it('can resolve a entity query for a SavedItem by Url on Corpus Item', async () => {
    const RESOLVE_REFERENCE_QUERY = `
      query ($_representations: [_Any!]!) {
        _entities(representations: $_representations) {
          ... on CorpusItem {
            savedItem {
              url
              id
            }
          }
        }
      }
    `;

    const variables = {
      _representations: [
        {
          __typename: 'CorpusItem',
          url: 'http://abc',
        },
        {
          __typename: 'CorpusItem',
          url: 'http://def',
        },
        {
          __typename: 'CorpusItem',
          url: 'http://blah',
        },
      ],
    };

    const res = await request(app).post(url).set(headers).send({
      query: RESOLVE_REFERENCE_QUERY,
      variables,
    });

    expect(res.body.data._entities[0].savedItem.url).to.equal('http://abc');
    expect(res.body.data._entities[0].savedItem.id).to.equal('1');
    expect(res.body.data._entities[1].savedItem.url).to.equal('http://def');
    expect(res.body.data._entities[1].savedItem.id).to.equal('2');
    expect(res.body.data._entities[2].savedItem).to.be.null;
  });
});
