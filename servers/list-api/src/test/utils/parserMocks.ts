import nock from 'nock';
import config from '../../config/index.js';

function mockParserRequest(
  urlToParse: string,
  data: any,
  options: { endpoint: string; queryParams: { [key: string]: string } },
) {
  nock(config.parserDomain)
    .get(options.endpoint)
    .query(options.queryParams)
    .reply(200, data);
}

export const mockParserGetItemRequest = (urlToParse: string, data: any) => {
  return mockParserRequest(urlToParse, data, {
    endpoint: `/${config.parserVersion}/getItemListApi`,
    queryParams: { url: urlToParse, getItem: '1' },
  });
};

export const mockParserGetItemIdRequest = (
  urlToParse: string,
  itemId: string | null,
) => {
  return mockParserRequest(
    urlToParse,
    itemId != null ? { item_id: itemId } : null,
    {
      endpoint: `/${config.parserVersion}/getItem`,
      queryParams: { url: urlToParse, createIfNone: 'false' },
    },
  );
};
