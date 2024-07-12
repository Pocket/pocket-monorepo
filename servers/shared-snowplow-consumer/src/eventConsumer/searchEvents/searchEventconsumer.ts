import { PocketSearchEventHandler } from '../../snowplow/search/searchHandler';

export type PocketSearchPayload = {
  detail: { search: PocketSearchEvent };
  source: 'search-api-events';
  'detail-type': SearchEventDetailType;
};

export type SearchEventDetailType = 'pocket_search_result';

export type PocketSearchEvent = {};

// todo: why?
export function pocketSearchEventConsumer(requestBody: PocketSearchPayload) {
  new PocketSearchEventHandler().process(requestBody);
}
