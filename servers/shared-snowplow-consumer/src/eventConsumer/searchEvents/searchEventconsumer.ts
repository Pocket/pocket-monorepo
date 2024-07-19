import { PocketSearchEventHandler } from '../../snowplow/search/searchHandler';
import {
  APIUser,
  SearchResponseEvent1 as SearchResponseEvent,
  User,
} from '../../snowtype/snowplow';

export type PocketSearchPayload = {
  detail: { event: PocketSearchEvent };
  source: 'search-api-events';
  'detail-type': EventType;
};

export type EventType = 'search_response_generated';

export type PocketSearchEvent = { search: SearchResponseEvent } & {
  user: Pick<User, 'user_id' | 'hashed_user_id' | 'guid' | 'hashed_guid'>;
  apiUser: Pick<APIUser, 'api_id' | 'is_native' | 'is_trusted'>;
};

// todo: why?
export function pocketSearchEventConsumer(requestBody: PocketSearchPayload) {
  new PocketSearchEventHandler().process(requestBody);
}
