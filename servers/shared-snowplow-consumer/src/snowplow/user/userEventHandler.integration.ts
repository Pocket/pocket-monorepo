import { UserEventHandler } from './userEventHandler';
import {
  resetSnowplowEvents,
  getAllSnowplowEvents,
  getGoodSnowplowEvents,
  parseSnowplowData,
} from '../testUtils';
import { ObjectUpdate } from '../../snowtype/snowplow';
import { PocketEventType } from '@pocket-tools/event-bridge';

export const userEventsSchema = {
  account: expect.stringMatching('iglu:com.pocket/account/jsonschema'),
  objectUpdate: expect.stringMatching(
    'iglu:com.pocket/object_update/jsonschema',
  ),
  user: expect.stringMatching('iglu:com.pocket/user/jsonschema'),
  apiUser: expect.stringMatching('iglu:com.pocket/api_user/jsonschema'),
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
      schema: userEventsSchema.objectUpdate,
      data: { trigger: trigger, object: 'account' },
    })),
  );
}

function assertAccountDeleteSchema(eventContext) {
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: userEventsSchema.account,
        data: {
          object_version: 'new',
          user_id: parseInt(testEventData.detail.userId),
        },
      },
    ]),
  );
}

function assertAccountSchema(eventContext) {
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: userEventsSchema.account,
        data: {
          object_version: 'new',
          user_id: parseInt(testEventData.detail.userId),
          emails: [testEventData.detail.email],
        },
      },
    ]),
  );
}

function assertApiAndUserSchema(eventContext: { [p: string]: any }) {
  expect(eventContext.data).toEqual(
    expect.arrayContaining([
      {
        schema: userEventsSchema.user,
        data: {
          user_id: parseInt(testEventData.detail.userId),
          hashed_user_id: testEventData.detail.hashedId,
          email: testEventData.detail.email,
        },
      },
      {
        schema: userEventsSchema.apiUser,
        data: { api_id: parseInt(testEventData.detail.apiId) },
      },
    ]),
  );
}

const testEventData = {
  detail: {
    userId: '1',
    hashedId: 'test_hashed_user_id',
    email: 'test@pocket.com',
    isPremium: true,
    apiId: '1',
    timestamp: 12332123123,
    version: '1.0.0',
    eventType: PocketEventType.ACCOUNT_DELETION,
  },
};

describe('UserEventHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send account delete event to snowplow', async () => {
    new UserEventHandler().process({
      ...testEventData,
      source: 'user-events',
      'detail-type': PocketEventType.ACCOUNT_DELETION,
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
    assertAccountDeleteSchema(eventContext);
    assertApiAndUserSchema(eventContext);
    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['account_delete'],
    );
  });

  it('should send update email event to snowplow', async () => {
    new UserEventHandler().process({
      ...testEventData,
      source: 'user-events',
      'detail-type': PocketEventType.ACCOUNT_EMAIL_UPDATED,
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
    assertApiAndUserSchema(eventContext);
    assertAccountSchema(eventContext);
    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['account_email_updated'],
    );
  });

  it('should send account password changed event to snowplow', async () => {
    new UserEventHandler().process({
      ...testEventData,
      source: 'user-events',
      'detail-type': PocketEventType.ACCOUNT_PASSWORD_CHANGED,
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
    assertApiAndUserSchema(eventContext);
    assertAccountSchema(eventContext);
    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['account_password_changed'],
    );
  });
});
