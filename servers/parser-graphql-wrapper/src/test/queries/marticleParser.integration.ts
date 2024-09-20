/**
 * TODO:
 * Rename to a marticleParser.functional.ts
 * This change requires a few changes in other places including:
 * - npm scripts - tell jest to run *.function.ts tests
 * - CircleCI config - Create a job to the function test npm script from above
 */

import nock, { cleanAll, restore } from 'nock';
import { getRedis } from '../../cache';
import { VideoType, Videoness } from '../../__generated__/resolvers-types';
import { startServer } from '../../apollo/server';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { gql } from 'graphql-tag';
import { IContext } from '../../apollo/context';
import { Application } from 'express';
import {
  nockResponseForParser,
  videonessToParser,
} from '../utils/parserResponse';
import { faker } from '@faker-js/faker';
import { BoolStringParam, MediaTypeParam } from '../../datasources/ParserAPI';
import config from '../../config';

function makeResponseForParserTextEndpoint(options: {
  url: string;
  html: string;
  isArticle: boolean;
  videoness: Videoness;
}) {
  const scope = nock(`${config.parser.baseEndpoint}`);
  const { url, html, isArticle, videoness } = options;

  const itemId = faker.number.bigInt().toString();
  // first request will not ask the parser for article data
  const itemMock = nockResponseForParser(url, {
    parserOptions: {
      images: MediaTypeParam.DIV_TAG,
      videos: MediaTypeParam.DIV_TAG,
    },
    scope: scope,
    data: {
      item_id: itemId,
      isArticle: +isArticle,
      isVideo: videoness === Videoness.HasVideos ? 1 : 0,
      has_video: videonessToParser(videoness),
      images: {
        1: {
          item_id: itemId,
          image_id: '1',
          width: '200',
          height: '150',
          src: 'https://imagine.a-cool.image.jpg',
          caption: 'I told you this is a cool image',
          credit: 'give it all to kelvin',
        },
      },
      videos: {
        1: {
          item_id: itemId,
          video_id: '1',
          src: 'https://imagine.a-cool.video',
          width: '200',
          height: '150',
          vid: 'wubbalubbadubdub',
          length: '10',
          type: '1',
        },
      },
    },
  });

  // second request will get article data
  nockResponseForParser(url, {
    parserOptions: {
      images: MediaTypeParam.AS_COMMENTS,
      videos: MediaTypeParam.AS_COMMENTS,
      noArticle: BoolStringParam.FALSE,
    },
    scope: scope,
    data: { ...itemMock.data, article: html },
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
  });

  afterAll(async () => {
    await server.stop();
    await getRedis().disconnect();
    cleanAll();
    restore();
  });

  it('should return marticle text for the given url', async () => {
    const testInput =
      '<p>A paragraph with an <b>image</b><p>Another paragraph with some <em>em</em> text</p>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: true,
      videoness: Videoness.NoVideos,
    });

    const GET_ITEMS_BY_URL = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
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

    expect(res.body.data).not.toBeUndefined();
    const marticle = res.body.data.itemByUrl.marticle;
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
      videoness: Videoness.NoVideos,
    });

    const GET_ITEMS_BY_URL = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
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
    expect(res.body.data).not.toBeUndefined();
    const marticle = res.body.data.itemByUrl.marticle;
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
      videoness: Videoness.HasVideos,
    });

    const GET_ITEMS_BY_URL = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
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
    expect(res.body.data).not.toBeUndefined();
    const marticle = res.body.data.itemByUrl.marticle;
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
  it('should not return Marticle data if the Parser responds with isArticle=0 and videoness=NoVideos', async () => {
    // Even if there is an extracted article string
    const testInput =
      '<p>A paragraph with an <b>image</b><p>Another paragraph with some <em>em</em> text</p>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: false,
      videoness: Videoness.NoVideos,
    });

    const GET_ITEMS_BY_URL = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
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

    expect(res.body.data).not.toBeUndefined();
    const marticle = res.body.data.itemByUrl.marticle;
    expect(marticle).toStrictEqual([]);
  });
  it('should return Marticle data if videoness=HasVideo', async () => {
    const testInput = '<div><!--VIDEO_1--></div>';
    makeResponseForParserTextEndpoint({
      url: testUrl,
      html: testInput,
      isArticle: false,
      videoness: Videoness.HasVideos,
    });

    const GET_ITEMS_BY_URL = gql`
      query itemByUrl($url: String!) {
        itemByUrl(url: $url) {
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
    expect(res.body.data).not.toBeUndefined();
    const marticle = res.body.data.itemByUrl.marticle;
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
