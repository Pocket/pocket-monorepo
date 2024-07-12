import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { PocketSearchEvent } from '../../eventConsumer/searchEvents/searchEventconsumer';
import { PocketSearchEventHandler } from './searchHandler';

export const shareableListItemEventSchema = {
  objectUpdate: expect.stringMatching(
    'iglu:com.pocket/object_update/jsonschema',
  ),
  shareable_list_item: expect.stringMatching(
    'iglu:com.pocket/shareable_list_item/jsonschema',
  ),
};

describe('ShareableListItemEventHandler', () => {
  const searchResult: PocketSearchEvent = {};
  beforeEach(async () => {
    await resetSnowplowEvents();
  });
  it.each([
    {
      detail: { searchResult },
      source: 'search-api-events' as const,
      'detail-type': 'pocket_search_result_created' as const,
    },
  ])('sends event to snowplow', async (event) => {
    new PocketSearchEventHandler().process(event);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);
    const goodEvent = (await getGoodSnowplowEvents())[0];
    expect(goodEvent.event.app_id).toEqual('pocket-search-api');
    expect(goodEvent.event.event_name).toEqual('object_update');
    const description = parseSnowplowData(goodEvent.rawEvent.parameters.ue_px);
    expect(description.data.data).toEqual({
      object: 'pocket_search_result',
      trigger: event['detail-type'],
    });
    const eventContext = parseSnowplowData(goodEvent.rawEvent.parameters.cx);
    expect(eventContext.data[0].data).toEqual(searchResult);
    expect(eventContext.data[0].schema).toMatch(
      'iglu:com.pocket/pocket_share/jsonschema/',
    );
  });
});
