import { ShareEvent } from '@pocket-tools/event-bridge';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { PocketShareEventHandler } from './shareHandler';

export const shareableListItemEventSchema = {
  objectUpdate: expect.stringMatching(
    'iglu:com.pocket/object_update/jsonschema',
  ),
  shareable_list_item: expect.stringMatching(
    'iglu:com.pocket/shareable_list_item/jsonschema',
  ),
};

describe('ShareableListItemEventHandler', () => {
  const pocketShare: ShareEvent['detail']['pocketShare'] = {
    target_url: 'https://chess.com',
    created_at: 12345,
    slug: 'abc-123',
    note_length: 25,
    quote_count: 0,
  };
  beforeEach(async () => {
    await resetSnowplowEvents();
  });
  it.each([
    {
      detail: { pocketShare },
      source: 'shares-api-events' as const,
      'detail-type': 'pocket_share_created' as const,
    },
    {
      detail: { pocketShare },
      source: 'shares-api-events' as const,
      'detail-type': 'pocket_share_context_updated' as const,
    },
  ])('sends event to snowplow', async (event) => {
    new PocketShareEventHandler().process(event as ShareEvent);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);
    const goodEvent = (await getGoodSnowplowEvents())[0];
    expect(goodEvent.event.app_id).toEqual('pocket-shares-api');
    expect(goodEvent.event.event_name).toEqual('object_update');
    const description = parseSnowplowData(goodEvent.rawEvent.parameters.ue_px);
    expect(description.data.data).toEqual({
      object: 'pocket_share',
      trigger: event['detail-type'],
    });
    const eventContext = parseSnowplowData(goodEvent.rawEvent.parameters.cx);
    expect(eventContext.data[0].data).toEqual(pocketShare);
    expect(eventContext.data[0].schema).toMatch(
      'iglu:com.pocket/pocket_share/jsonschema/',
    );
  });
});
