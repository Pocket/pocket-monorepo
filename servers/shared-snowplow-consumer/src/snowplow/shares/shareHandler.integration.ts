import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { ObjectUpdate } from '../../snowtype/snowplow';
import { PocketShareEvent } from '../../eventConsumer/sharesEvents/sharesEventConsumer';
import { PocketShareEventHandler } from './shareHandler';

export const shareableListItemEventSchema = {
  objectUpdate: 'iglu:com.pocket/object_update/jsonschema/1-0-16',
  shareable_list_item: 'iglu:com.pocket/shareable_list_item/jsonschema/1-0-5',
};

function assertValidSnowplowObjectUpdateEvents(
  events,
  triggers: ObjectUpdate['trigger'][],
) {
  const parsedEvents = events
    .map(parseSnowplowData)
    .map((parsedEvent) => parsedEvent.data);

  expect(parsedEvents).toEqual(
    triggers.map((trigger) => ({
      schema: shareableListItemEventSchema.objectUpdate,
      data: { trigger: trigger, object: 'shareable_list_item' },
    })),
  );
}

describe('ShareableListItemEventHandler', () => {
  const pocketShare: PocketShareEvent = {
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
  ])('sends event to snowplow', async (event) => {
    new PocketShareEventHandler().process(event);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);
    const goodEvents = await getGoodSnowplowEvents();

    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );
    console.log('hi');
  });
});
