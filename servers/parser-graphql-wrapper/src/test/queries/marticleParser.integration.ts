/**
 * TODO:
 * Rename to a marticleParser.functional.ts
 * This change requires a few changes in other places including:
 * - npm scripts - tell jest to run *.function.ts tests
 * - CircleCI config - Create a job to the function test npm script from above
 */

import nock, { cleanAll } from 'nock';
import { getRedis } from '../../cache';
import { VideoType } from '../../__generated__/resolvers-types';
import { startServer } from '../../apollo/server';
import { ParserAPI } from '../../datasources/ParserAPI';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../../apollo/context';
import { Application } from 'express';

function makeResponseForParserTextEndpoint(options: {
  url: string;
  html: string;
  isArticle: boolean;
  isVideo: boolean;
}) {
  const { url, html, isArticle, isVideo } = options;
  const { query } = ParserAPI.buildQueryString({
    ...ParserAPI.defaultParams,
    url: url,
  });
  return nock('http://example-parser.com', {
    encodedQueryParams: false,
  })
    .get(`/?${query}`)
    .reply(200, {
      isArticle: +isArticle,
      isVideo: +isVideo,
      article: html,
      //needs item, otherwise the endpoint throws error
      item: {
        given_url: url,
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

describe('Marticle integration ', () => {
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
      .query({
        url: testUrl,
        getItem: '1',
        output: 'regular',
        enableItemUrlFallback: '1',
      })
      .reply(200, {
        item: {
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

  it('should return marticle text for the given url', async () => {
    const testInput =
      '<p>A paragraph with an <b>image</b><p>Another paragraph with some <em>em</em> text</p>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: true,
      isVideo: false,
    });

    const GET_ITEMS_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
          marticle {
            __typename
            ... on MarticleText {
              content
            }
          }
        }
      }
    `;

    const variables = {
      url: testUrl,
    };

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEMS_BY_URL), variables });

    const expected = [
      {
        __typename: 'MarticleText',
        content: 'A paragraph with an **image**',
      },
      {
        __typename: 'MarticleText',
        content: 'Another paragraph with some _em_ text',
      },
    ];

    expect(res.body.data).not.toBeUndefined;
    const marticle = res.body.data.getItemByUrl.marticle;
    expect(marticle.length).toBeGreaterThan(0);
    expect(marticle).toStrictEqual(expected);
  });

  it('should return marticle image for the given url', async () => {
    const testInput =
      '<p>A paragraph with an <b>image</b></p>' +
      '<div><!--IMG_1--></div>' +
      '<p>Another paragraph with some <em>em</em> text</p>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: true,
      isVideo: false,
    });

    const GET_ITEMS_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
          marticle {
            ... on MarticleText {
              __typename
              content
            }
            ... on Image {
              __typename
              width
              height
              imageId
              src
              url
              caption
              credit
            }
          }
        }
      }
    `;

    const variables = {
      url: testUrl,
    };

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEMS_BY_URL), variables });
    expect(res.body.data).not.toBeUndefined;
    const marticle = res.body.data.getItemByUrl.marticle;
    expect(marticle.length).toBeGreaterThan(0);
    expect(marticle).toStrictEqual([
      {
        __typename: 'MarticleText',
        content: 'A paragraph with an **image**',
      },
      {
        __typename: 'Image',
        imageId: 1,
        width: 200,
        height: 150,
        src: 'https://imagine.a-cool.image.jpg',
        url: 'https://imagine.a-cool.image.jpg/',
        caption: 'I told you this is a cool image',
        credit: 'give it all to kelvin',
      },
      {
        __typename: 'MarticleText',
        content: 'Another paragraph with some _em_ text',
      },
    ]);
  });

  it('should return marticle video for the given url', async () => {
    const testInput =
      '<p>A paragraph with a <b>video</b></p>' +
      '<div><!--VIDEO_1--></div>' +
      '<p>Another paragraph with some <em>em</em> text</p>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: true,
      isVideo: false,
    });

    const GET_ITEMS_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
          marticle {
            ... on MarticleText {
              __typename
              content
            }
            ... on Video {
              __typename
              videoId
              src
              width
              height
              vid
              length
              type
            }
          }
        }
      }
    `;

    const variables = {
      url: testUrl,
    };

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEMS_BY_URL), variables });
    expect(res.body.data).not.toBeUndefined;
    const marticle = res.body.data.getItemByUrl.marticle;
    expect(marticle.length).toBeGreaterThan(0);
    expect(marticle).toStrictEqual([
      {
        __typename: 'MarticleText',
        content: 'A paragraph with a **video**',
      },
      {
        __typename: 'Video',
        videoId: 1,
        src: 'https://imagine.a-cool.video',
        width: 200,
        height: 150,
        vid: 'wubbalubbadubdub',
        length: 10,
        type: VideoType.Youtube,
      },
      {
        __typename: 'MarticleText',
        content: 'Another paragraph with some _em_ text',
      },
    ]);
  });
  it('should not return Marticle data if the Parser responds with isArticle=0 and isVideo=0', async () => {
    // Even if there is an extracted article string
    const testInput =
      '<p>A paragraph with an <b>image</b><p>Another paragraph with some <em>em</em> text</p>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: false,
      isVideo: false,
    });

    const GET_ITEMS_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
          marticle {
            __typename
            ... on MarticleText {
              content
            }
          }
        }
      }
    `;

    const variables = {
      url: testUrl,
    };

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEMS_BY_URL), variables });

    expect(res.body.data).not.toBeUndefined;
    const marticle = res.body.data.getItemByUrl.marticle;
    expect(marticle).toStrictEqual([]);
  });
  it('should return Marticle data if isVideo=1', async () => {
    const testInput = '<div><!--VIDEO_1--></div>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: false,
      isVideo: true,
    });

    const GET_ITEMS_BY_URL = gql`
      query getItemByUrl($url: String!) {
        getItemByUrl(url: $url) {
          marticle {
            ... on Video {
              __typename
              videoId
              src
              width
              height
              vid
              length
              type
            }
          }
        }
      }
    `;

    const variables = {
      url: testUrl,
    };

    const res = await request(app)
      .post(graphQLUrl)
      .send({ query: print(GET_ITEMS_BY_URL), variables });
    expect(res.body.data).not.toBeUndefined;
    const marticle = res.body.data.getItemByUrl.marticle;
    expect(marticle.length).toBeGreaterThan(0);
    expect(marticle).toStrictEqual([
      {
        __typename: 'Video',
        videoId: 1,
        src: 'https://imagine.a-cool.video',
        width: 200,
        height: 150,
        vid: 'wubbalubbadubdub',
        length: 10,
        type: VideoType.Youtube,
      },
    ]);
  });
});
