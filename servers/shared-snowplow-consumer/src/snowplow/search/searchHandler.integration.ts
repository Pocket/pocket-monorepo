import { SearchEvent } from '@pocket-tools/event-bridge';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { PocketSearchEventHandler } from './searchHandler';

export const shareableListItemEventSchema = {
  objectUpdate: expect.stringMatching(
    'iglu:com.pocket/object_update/jsonschema',
  ),
  shareable_list_item: expect.stringMatching(
    'iglu:com.pocket/shareable_list_item/jsonschema',
  ),
};

describe('PocketSearchEventHandler', () => {
  const event: SearchEvent['detail'] = {
    event: {
      search: {
        id: '29239asdfjdf34324',
        result_count_total: 2,
        result_urls: [
          'https://fantasticslimes.com',
          'https://philosophydive.com',
        ],
        returned_at: 1673445238,
        search_query: {
          query: 'slime molds consciousness',
          scope: 'all_contentful',
          filter: ['excludeCollections'],
        },
        search_type: 'corpus_en',
      },
      user: {
        user_id: 123456,
        hashed_user_id: 'abc123def456',
        guid: 987654,
        hashed_guid: 'zyx987wvu654',
      },
      apiUser: {
        api_id: 999,
        is_native: true,
        is_trusted: true,
      },
    },
  };
  beforeEach(async () => {
    await resetSnowplowEvents();
  });
  it.each([
    {
      detail: event,
      source: 'search-api-events' as const,
      'detail-type': 'search_response_generated' as const,
    },
  ])('sends event to snowplow', async (event) => {
    new PocketSearchEventHandler().process(event as SearchEvent);
    // Snowplow takes forever and isn't async
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);
    const goodEvent = (await getGoodSnowplowEvents())[0];
    expect(goodEvent.event.app_id).toEqual('pocket-search-api');
    expect(goodEvent.event.event_name).toEqual('search_response_event');
    const description = parseSnowplowData(goodEvent.rawEvent.parameters.ue_px);
    expect(description.data.data).toEqual(event.detail.event.search);
    const eventContext = parseSnowplowData(goodEvent.rawEvent.parameters.cx);
    expect(eventContext.data[0].data).toEqual(event.detail.event.apiUser);
    expect(eventContext.data[1].data).toEqual(event.detail.event.user);
  });
});
