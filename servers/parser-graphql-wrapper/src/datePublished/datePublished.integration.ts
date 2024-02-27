import { ApolloServer } from '@apollo/server';
import { IContext } from '../context';
import { startServer } from '../server';
import nock from 'nock';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import { Application } from 'express';

describe('datePublished', () => {
  const testUrl = 'https://someurl.com';

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  let parserItem = {
    given_url: testUrl,
    normal_url: testUrl,
    item_id: '1',
    resolved_id: '1',
    domain_metadata: {
      name: 'domain',
      logo: 'logo',
    },
    authors: [],
    images: [],
    videos: [],
    date_published: '2024-02-26 21:13:41',
  };

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should return `datePublished` for a CorpusItem when parser item has `datePublished` property', async () => {
    // mock the Parser call to return a parser item with `datePublished` filled in
    nock(`http://example-parser.com`)
      .get(`/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular`)
      .reply(200, {
        item: parserItem,
      });

    const corpus_item_query_ = gql`
      query CorpusItem {
        _entities(
          representations: {
            url: "https://someurl.com"
            __typename: "CorpusItem"
          }
        ) {
          ... on CorpusItem {
            url
            datePublished
          }
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(corpus_item_query_) });
    expect(res.body).not.toBeNull();
    console.log(res.body.data);
    expect(res.body.data._entities[0].datePublished).toBe(
      parserItem.date_published,
    );
  });

  it('should return null `datePublished` for a CorpusItem when parser item does not have a `datePublished` property', async () => {
    parserItem = { ...parserItem, date_published: null };

    // mock the Parser call to return a parser item with `datePublished` as null
    nock(`http://example-parser.com`)
      .get(`/?url=${encodeURIComponent(testUrl)}&getItem=1&output=regular`)
      .reply(200, {
        item: parserItem,
      });

    const corpus_item_query_ = gql`
      query CorpusItem {
        _entities(
          representations: {
            url: "https://someurl.com"
            __typename: "CorpusItem"
          }
        ) {
          ... on CorpusItem {
            url
            datePublished
          }
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(corpus_item_query_) });
    expect(res.body).not.toBeNull();
    expect(res.body.data._entities[0].datePublished).toBe(null);
  });
});
