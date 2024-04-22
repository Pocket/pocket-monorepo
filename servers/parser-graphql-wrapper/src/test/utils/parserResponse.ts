import nock, { Scope } from 'nock';
import config from '../../config';
import {
  BoolStringParam,
  MediaTypeParam,
  ParserAPI,
  ParserAPIOptions,
  ParserAPIQueryParams,
} from '../../datasources/ParserAPI';
import { ParserResponse } from '../../datasources/ParserAPITypes';
import { faker } from '@faker-js/faker';
import { Videoness } from '../../__generated__/resolvers-types';
import { merge } from 'lodash';
import Keyv from 'keyv';

export const fakeArticle: Partial<ParserResponse> = {
  isArticle: 1,
  article: `<p>"Not so handsome now", thought Harry as he dipped Hermione in hot sauce. The Death Eaters were dead now, and Harry was hungier than he'd ever been.</p>`,
  given_url: 'https://botnik.org/content/harry-potter.html',
  images: {
    1: { image_id: '1', item_id: '1', src: 'https://image-cache.com/1234' },
  },
  videos: null,
};
export const newFakeArticle: Partial<ParserResponse> = {
  isArticle: 1,
  given_url: 'https://botnik.org/content/harry-potter.html',
  article: `<p>Ron was going to be spiders. He just was. He wasn't proud of that, but it was going to be hard to not have spiders all over his body after all is said and done.</p><div><!--RIL_IMG_1--></div>`,
  images: {
    1: { image_id: '1', item_id: '1', src: 'https://image-cache.com/1234' },
  },
  authors: { '1': { author_id: '1', name: 'botnik', url: 'testing.com' } },
  videos: null,
};

/**
 * Converts parser item.has_video to a graphql enum
 * @param hasVideo
 */
export const videonessToParser = (hasVideo: Videoness): string => {
  switch (hasVideo) {
    case Videoness.NoVideos:
      return '0';
    case Videoness.HasVideos:
      return '1';
    case Videoness.IsVideo:
      return '2';
    default:
      return '0';
  }
};

export type ParserMockResponse = {
  data: Partial<ParserResponse>;
  params: ParserAPIQueryParams;
  scope: Scope;
};

export const nockResponseForParser = (
  testUrl: string,
  options?: {
    parserOptions?: Partial<ParserAPIOptions>;
    data?: Partial<ParserResponse>;
    scope?: nock.Scope;
  },
): ParserMockResponse => {
  const params = ParserAPI.generateQueryParams(testUrl, options.parserOptions);

  const data = merge(fakerParserResponse(), options?.data);
  data.given_url = testUrl;
  data.normal_url = testUrl;
  if (params.queryParams.get('noArticle') == BoolStringParam.TRUE) {
    delete data.article;
  }

  const scope = options?.scope ?? nock(config.parser.baseEndpoint);
  scope
    .get(`${config.parser.dataPath}`)
    .query(params.queryParams)
    .reply(200, data);
  return { data, scope, params };
};

/**
 * Another helper for setting up the nocks since they have to be repeated.
 */
export function nockThreeStandardParserResponses(
  fakeData: any,
  url: string,
  refresh: boolean = false,
): {
  getItemMock: ParserMockResponse;
  marticleTextMock: ParserMockResponse;
  textMock: ParserMockResponse;
} {
  // Marticle
  const marticleTextMock = nockResponseForParser(url, {
    data: fakeData,
    parserOptions: {
      videos: MediaTypeParam.AS_COMMENTS,
      images: MediaTypeParam.AS_COMMENTS,
      noArticle: BoolStringParam.FALSE,
    },
  });

  // Article
  const textMock = nockResponseForParser(url, {
    data: marticleTextMock.data, // use the same faker data that was produced
    parserOptions: {
      videos: MediaTypeParam.DIV_TAG,
      images: MediaTypeParam.DIV_TAG,
      noArticle: BoolStringParam.FALSE,
    },
  });

  // Item Data
  // run this one last, because it will delete article data since this endpoint doesnt return it.
  const getItemMock = nockResponseForParser(url, {
    data: marticleTextMock.data, // use the same faker data that was produced
    parserOptions: {
      videos: MediaTypeParam.DIV_TAG,
      images: MediaTypeParam.DIV_TAG,
      noArticle: BoolStringParam.TRUE,
      refresh: refresh ? BoolStringParam.TRUE : BoolStringParam.FALSE,
    },
  });

  return {
    getItemMock,
    marticleTextMock,
    textMock,
  };
}

/**
 * Helper function to store data to the redis cache the same way that the RestDataSource does for testing.
 * https://github.com/apollographql/datasource-rest/blob/main/src/HTTPCache.ts#L85
 * @param cacheKey The key to cache the data under
 * @param data The data to cache
 * @param cache The KeyV cache
 */
export const cacheParserResponse = async (
  cacheKey: string,
  data: Partial<ParserResponse>,
  cache: Keyv,
  ttl: number = 36000,
) => {
  await cache.set(
    `httpcache:${cacheKey}`,
    JSON.stringify({
      body: JSON.stringify(data),
      ttlOverride: ttl,
      policy: {
        v: 1, //version
        ch: 0.1,
        imm: 86400000,
        t: Date.now(), // timestamp of request
        sh: true,
        st: 200, // status
        reqh: null, // request headers
        resh: { 'content-type': 'application/json' }, // response headers
        reqcc: {}, // request cookies
        rescc: {}, // response cookies
        a: true,
        m: 'GET', // method
        // u: `${config.parser.baseEndpoint}${config.parser.dataPath}?${queryParams.params.queryParams.toString()}`, URL but its ignored by the RestDataSource so no need to try and cache it
      },
    }),
    ttl,
  );
};

/**
 *
 * @param cacheKey  The key to cache the data under
 * @param cache The KeyV cache
 * @returns
 */
export const getCachedParserResponse = async (
  cacheKey: string,
  cache: Keyv,
): Promise<Partial<ParserResponse> | null> => {
  const data = await cache.get(`httpcache:${cacheKey}`);
  if (!data) {
    return null;
  }
  const httpData = JSON.parse(data);
  return JSON.parse(httpData.body) as Partial<ParserResponse>;
};

const fakerParserResponse = (): ParserResponse => {
  const givenURL = faker.internet.url();
  const resolvedUrl = faker.internet.url();
  const itemId = faker.number.bigInt().toString();
  return {
    given_url: givenURL,
    item_id: itemId,
    resolved_id: faker.number.bigInt().toString(),
    resolvedUrl: resolvedUrl,
    resolved_normal_url: resolvedUrl,
    normal_url: givenURL,
    host: faker.internet.domainName(),
    title: faker.lorem.sentence(),
    datePublished: '2022-06-29 15:14:49',
    time_to_read: faker.number.int({ min: 1, max: 60 }),
    date_resolved: '2022-06-29 15:14:49',
    has_old_dupes: faker.datatype.boolean().toString(),
    has_video: '1',
    has_image: '1',
    timePublished: faker.date.recent().getTime(),
    domain_id: faker.number.bigInt().toString(),
    origin_domain_id: faker.number.bigInt().toString(),
    mime_type: faker.system.mimeType(),
    content_length: faker.number.int(),
    encoding: faker.system.commonFileExt(),
    time_first_parsed: '2022-06-29 15:14:49',
    innerdomain_redirect: faker.number
      .int({ min: 1, max: 2 })
      .toFixed()
      .toString(),
    responseCode: '200',
    excerpt: faker.lorem.paragraph(),
    domainMetadata: {
      name: faker.company.name(),
      logo: faker.image.urlPlaceholder(),
      greyscale_logo: faker.image.urlPlaceholder(),
    },
    authors: {
      ['1']: {
        author_id: faker.number.int().toFixed().toString(),
        name: faker.person.fullName(),
        url: faker.internet.url(),
      },
    },
    images: {
      ['1']: {
        item_id: itemId,
        image_id: '1',
        src: faker.image.url(),
        width: faker.number.int().toString(),
        height: faker.number.int().toString(),
        credit: faker.person.fullName(),
        caption: faker.lorem.sentence(),
      },
    },
    videos: {
      ['1']: {
        item_id: itemId,
        video_id: '1',
        src: faker.image.url(),
        width: faker.number.int().toString(),
        height: faker.number.int().toString(),
        credit: faker.person.fullName(),
        caption: faker.lorem.sentence(),
      },
    },
    wordCount: faker.number.int(),
    isArticle: faker.number.int({ min: 0, max: 1 }),
    isVideo: faker.number.int({ min: 0, max: 1 }),
    isIndex: faker.number.int({ min: 0, max: 1 }),
    usedFallback: faker.number.int({ min: 0, max: 1 }),
    requiresLogin: faker.number.int({ min: 0, max: 1 }),
    lang: 'en',
    topImageUrl: faker.image.url(),
    article: faker.lorem.paragraphs(),
  };
};
