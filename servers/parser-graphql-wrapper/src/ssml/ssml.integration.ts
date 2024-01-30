import nock, { cleanAll } from 'nock';
import { getRedis } from '../cache';
import { startServer } from '../server';
import { MediaTypeParam, ParserAPI } from '../datasources/parserApi';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../context';
import { Application } from 'express';

function makeResponseForParserTextEndpoint(testUrl: string, html: string) {
  const { query } = ParserAPI.buildQueryString({
    ...ParserAPI.defaultParams,
    url: testUrl,
    images: MediaTypeParam.DIV_TAG,
    videos: MediaTypeParam.DIV_TAG,
  });

  return nock('http://example-parser.com', {
    encodedQueryParams: false,
  })
    .get(`/?${query}`)
    .reply(200, {
      article: html,
      //needs item, otherwise the endpoint throws error
      item: {
        given_url: testUrl,
      },
      images: {
        1: {
          image_id: '1',
          width: 200,
          height: 150,
          src: 'https://imagine.a-cool.image.jpg',
          caption: 'I told you this is a cool image',
          credit: 'give it all to kelvin',
        },
      },
      videos: {
        1: {
          video_id: '1',
          src: 'https://imagine.a-cool.video',
          width: '200',
          height: '150',
          vid: 'wubbalubbadubdub',
          length: '10',
          type: '1',
        },
      },
    });
}

describe('SSML integration ', () => {
  const testUrl = 'https://someurl.com';
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });

  beforeEach(() => {
    // Flush the redis cache before each test
    getRedis().clear();

    //first call for getItemByUrl.
    nock('http://example-parser.com')
      .get('/')
      .query({ url: testUrl, getItem: '1', output: 'regular' })
      .reply(200, {
        item: {
          title: 'The cool article',
          is_article: '1',
          date_published: '2023-04-26 07:30:00',
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
        },
      });
  });

  afterAll(async () => {
    await server.stop();
    await getRedis().disconnect();
    cleanAll();
  });

  it('should return ssml text for the given url', async () => {
    const testInput =
      '<p>A paragraph with an <b>image</b><p>Another paragraph with some <em>em</em> text</p>';
    makeResponseForParserTextEndpoint(testUrl, testInput);

    const GET_ITEMS_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
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
    const ssml = res.body.data.getItemByUrl.ssml;
    expect(ssml).toBe(
      "<speak><prosody rate='medium' volume='medium'>The cool article, published by domain, on <say-as interpret-as='date' format='m/d/y'>3/3/2023</say-as></prosody><prosody rate='medium' volume='medium'> A paragraph with an  image  Another paragraph with some  em  text </prosody></speak>",
    );
  });
});
