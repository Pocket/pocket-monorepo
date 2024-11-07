import { ApolloServer } from '@apollo/server';
import { IContext } from '../../apollo/context';
import { startServer } from '../../apollo/server';
import { print } from 'graphql/index';
import { gql } from 'graphql-tag';
import request from 'supertest';
import { Application } from 'express';
import { nockResponseForParser } from '../utils/parserResponse';
import { getRedis } from '../../cache';
import { ParserResponse } from '../../datasources/ParserAPITypes';
import { cleanAll, restore } from 'nock';

describe('responseCode', () => {
  const testUrl = 'https://someurl.com';

  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  const parserItem: Partial<ParserResponse> = {
    given_url: testUrl,
    normal_url: testUrl,
    item_id: '1',
    resolved_id: '1',
    domainMetadata: {
      name: 'domain',
      logo: 'logo',
    },
    authors: [],
    images: [],
    videos: [],
    time_to_read: 5,
  };

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  beforeEach(async () => {
    await getRedis().clear();
  });

  afterAll(async () => {
    await server.stop();
    cleanAll();
    restore();
  });

  it('should return 200 response code when parser returns "" ', async () => {
    nockResponseForParser(testUrl, {
      data: { ...parserItem, responseCode: '' },
    });

    const query = gql`
      query itemByUrl {
        itemByUrl(url: "https://someurl.com") {
          givenUrl
          responseCode
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(query) });
    expect(res.body).not.toBeNull();
    expect(res.body.data.itemByUrl.responseCode).toBe(200);
  });

  it('should return 403 response code when parser returns 403 ', async () => {
    nockResponseForParser(testUrl, {
      data: { ...parserItem, responseCode: '403' },
    });

    const query = gql`
      query itemByUrl {
        itemByUrl(url: "https://someurl.com") {
          givenUrl
          responseCode
        }
      }
    `;

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(query) });
    expect(res.body).not.toBeNull();
    expect(res.body.data.itemByUrl.responseCode).toBe(403);
  });
});
