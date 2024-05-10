import { ProspectEventHandler } from './prospectEventHandler';
import { testProspectData } from './testData';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { ObjectUpdate } from '../../snowtype/snowplow';
import { ProspectEventBridgePayload } from '../../eventConsumer/prospectEvents/types';

export const prospectEventSchema = {
  objectUpdate: expect.stringMatching(
    'iglu:com.pocket/object_update/jsonschema',
  ),
  prospect: expect.stringMatching('iglu:com.pocket/prospect/jsonschema/'),
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
      schema: prospectEventSchema.objectUpdate,
      data: { trigger: trigger, object: 'prospect' },
    })),
  );
}

function assertProspectSchema(eventContext) {
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: prospectEventSchema.prospect,
        data: {
          object_version: 'new',
          prospect_id: testProspectData.prospectId,
          url: testProspectData.url,
          title: testProspectData.title,
          excerpt: testProspectData.excerpt,
          image_url: testProspectData.imageUrl,
          language: testProspectData.language,
          topic: testProspectData.topic,
          is_collection: testProspectData.isCollection,
          is_syndicated: testProspectData.isSyndicated,
          authors: testProspectData.authors.split(','),
          publisher: testProspectData.publisher,
          domain: testProspectData.domain,
          prospect_source: testProspectData.prospectType,
          scheduled_surface_id: testProspectData.scheduledSurfaceGuid,
          created_at: testProspectData.createdAt,
          reviewed_by: testProspectData.reviewedBy,
          reviewed_at: testProspectData.reviewedAt,
          prospect_review_status: testProspectData.prospectReviewStatus,
        },
      },
    ]),
  );
}

const testEventData: ProspectEventBridgePayload = {
  source: 'prospect-events',
  detail: {
    ...testProspectData,
  },
  'detail-type': 'prospect-dismiss',
};

describe('ProspectEventHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send prospectEvent to snowplow ', async () => {
    new ProspectEventHandler().process({
      ...testEventData,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).toBe(1);
    expect(allEvents.good).toBe(1);
    expect(allEvents.bad).toBe(0);

    const goodEvents = await getGoodSnowplowEvents();
    const eventContext = parseSnowplowData(
      goodEvents[0].rawEvent.parameters.cx,
    );

    assertProspectSchema(eventContext);

    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['prospect_reviewed'],
    );
  });
});
