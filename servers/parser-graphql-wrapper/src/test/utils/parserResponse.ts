import nock from 'nock';
import config from '../../config';
import {
  BoolStringParam,
  ParserAPI,
  ParserAPIOptions,
} from '../../datasources/ParserAPI';
import { ParserResponse } from '../../datasources/ParserAPITypes';
import { faker } from '@faker-js/faker';

export const nockResponseForParser = (
  testUrl: string,
  options?: {
    parserOptions?: Partial<ParserAPIOptions>;
    data?: Partial<ParserResponse>;
  },
): ParserResponse => {
  const queryParams = new URLSearchParams({
    ...ParserAPI.DEFAULT_PARSER_OPTIONS,
    ...options?.parserOptions,
    url: testUrl,
  });

  const data = { ...fakerParserResponse(), ...options?.data };
  if (options?.parserOptions?.article == BoolStringParam.FALSE) {
    data.article = undefined;
  }

  nock(`${config.parser.baseEndpoint}`)
    .get(`${config.parser.dataPath}`)
    .query(queryParams)
    .reply(200, data);
  return data;
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
    datePublished: faker.date.past().toISOString(),
    time_to_read: faker.number.int({ min: 1, max: 60 }),
    date_resolved: faker.date.recent().toISOString(),
    has_old_dupes: faker.datatype.boolean().toString(),
    has_video: '1',
    has_image: '1',
    timePublished: faker.date.recent().getTime(),
    domain_id: faker.number.bigInt().toString(),
    origin_domain_id: faker.number.bigInt().toString(),
    mime_type: faker.system.mimeType(),
    content_length: faker.number.int(),
    encoding: faker.system.commonFileExt(),
    time_first_parsed: faker.date.recent().toISOString(),
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
