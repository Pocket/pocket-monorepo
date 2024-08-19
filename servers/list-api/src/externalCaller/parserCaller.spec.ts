import { ParserCaller } from './parserCaller';
import config from '../config';
import {
  mockParserGetItemRequest,
  mockParserGetItemIdRequest,
} from '../test/utils/parserMocks';
import nock, { cleanAll, restore } from 'nock';

describe('ParserCallerTest', function () {
  const urlToParse = 'https://igiveyou.a.test';

  afterAll(() => {
    cleanAll();
    restore();
  });

  it('should retrieve item from parser service', async () => {
    mockParserGetItemRequest(urlToParse, {
      item: {
        given_url: urlToParse,
        item_id: 8,
        resolved_id: 9,
        title: 'The Not Evil Search Engine',
      },
    });

    const res = await ParserCaller.getOrCreateItem(urlToParse);
    expect(res.itemId).toBe(8);
    expect(res.title).toBe('The Not Evil Search Engine');
    expect(res.resolvedId).toBe(9);
  });

  it('should throw error when there is no item in the response', async () => {
    mockParserGetItemRequest(urlToParse, {});

    const res = ParserCaller.getOrCreateItem(urlToParse, 1);
    await expect(res).rejects.toEqual(
      new Error(`Unable to parse and generate item for url`),
    );
  });

  it('should throw error when the item id is null', async () => {
    mockParserGetItemRequest(urlToParse, {
      item: {
        given_url: urlToParse,
        item_id: null,
      },
    });

    const res = ParserCaller.getOrCreateItem(urlToParse, 1);
    await expect(res).rejects.toEqual(
      new Error(`Unable to parse and generate item for url`),
    );
  });

  it('should throw error when the resolved id is null', async () => {
    mockParserGetItemRequest(urlToParse, {
      item: {
        given_url: urlToParse,
        resolved_id: null,
      },
    });

    const res = ParserCaller.getOrCreateItem(urlToParse, 1);
    await expect(res).rejects.toEqual(
      new Error(`Unable to parse and generate item for url`),
    );
  });

  it('should retry parser request 3 times when fails', async () => {
    nock(config.parserDomain)
      .get(`/${config.parserVersion}/getItemListApi`)
      .query({ url: urlToParse, getItem: '1' })
      .reply(200, {})
      .get(`/${config.parserVersion}/getItemListApi`)
      .query({ url: urlToParse, getItem: '1' })
      .reply(503, {})
      .get(`/${config.parserVersion}/getItemListApi`)
      .query({ url: urlToParse, getItem: '1' })
      .reply(200, {
        item: {
          given_url: urlToParse,
          item_id: 8,
          resolved_id: 9,
          title: 'The Not Evil Search Engine',
        },
      });

    const res = await ParserCaller.getOrCreateItem(urlToParse);
    expect(res.itemId).toBe(8);
    expect(res.title).toBe('The Not Evil Search Engine');
    expect(res.resolvedId).toBe(9);
  });
  it('should throw error if request was not ok', async () => {
    nock(config.parserDomain)
      .get(`/${config.parserVersion}/getItemListApi`)
      .query({ url: urlToParse, getItem: '1' })
      .reply(200, {})
      .get(`/${config.parserVersion}/getItemListApi`)
      .query({ url: urlToParse, getItem: '1' })
      .reply(503, {})
      .get(`/${config.parserVersion}/getItemListApi`)
      .query({ url: urlToParse, getItem: '1' })
      .reply(500, {});

    const res = ParserCaller.getOrCreateItem(urlToParse);
    await expect(res).rejects.toEqual(
      new Error(`Unable to parse and generate item for url`),
    );
  });
  it('should retrieve item id from parser service', async () => {
    mockParserGetItemIdRequest(urlToParse, '22');
    const itemId = await ParserCaller.getItemIdFromUrl(urlToParse);
    expect(itemId).toBe('22');
  });
  it('should return null if item does not exist', async () => {
    mockParserGetItemIdRequest(urlToParse, null);
    const itemId = await ParserCaller.getItemIdFromUrl(urlToParse);
    expect(itemId).toBeNull();
  });
});
