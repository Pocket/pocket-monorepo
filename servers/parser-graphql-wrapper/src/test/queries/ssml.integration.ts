import { cleanAll, restore } from 'nock';
import { getRedis } from '../../cache';
import { startServer } from '../../apollo/server';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../../apollo/context';
import { Application } from 'express';
import { nockResponseForParser } from '../utils/parserResponse';
import { BoolStringParam, MediaTypeParam } from '../../datasources/ParserAPI';
import { conn as readitlabConn } from '../../databases/readitlab';
import { conn as sharesConn } from '../../databases/readitlaShares';

describe('SSML integration ', () => {
  const testUrl = 'https://someurl.com/test';
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  beforeEach(async () => {
    // Flush the redis cache before each test
    await getRedis().clear();
  });

  afterAll(async () => {
    await server.stop();
    await getRedis().disconnect();
    cleanAll();
    restore();
    await readitlabConn().destroy();
    await sharesConn().destroy();
    jest.restoreAllMocks();
  });

  it('should return ssml text for the given url', async () => {
    const testInput =
      '<p>A paragraph with an <b>image</b><p>Another paragraph with some <em>em</em> text</p>';
    //first call for itemByUrl.
    const itemMock = nockResponseForParser(testUrl, {
      data: {
        isArticle: 1,
        title: 'The cool article',
        domainMetadata: { name: 'domain', logo: '' },
        datePublished: '2023-03-03 00:00:00',
      },
    });
    // ssml call
    nockResponseForParser(testUrl, {
      parserOptions: {
        noArticle: BoolStringParam.FALSE,
        videos: MediaTypeParam.DIV_TAG,
        images: MediaTypeParam.DIV_TAG,
      },
      data: { ...itemMock.data, article: testInput },
    });

    const GET_ITEMS_BY_URL = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
          ssml
        }
      }
    `;

    const variables = {
      url: testUrl,
    };

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEMS_BY_URL), variables });

    expect(res.body.data).not.toBeUndefined();
    const ssml = res.body.data.itemByUrl.ssml;
    expect(ssml).toBe(
      "<speak><prosody rate='medium' volume='medium'>The cool article, published by domain, on <say-as interpret-as='date' format='m/d/y'>3/3/2023</say-as></prosody><prosody rate='medium' volume='medium'> A paragraph with an  image  Another paragraph with some  em  text </prosody></speak>",
    );
  });
});
