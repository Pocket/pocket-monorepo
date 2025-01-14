import { readClient, writeClient } from '../../../../database/client';
import { ContextManager as CMClass } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

// For constructor spying in connection management block
import * as ContextModule from '../../../../server/context';
import { PocketEventType } from '@pocket-tools/event-bridge';
const ContextManager = ContextModule.ContextManager;

describe('createSavedItemTags mutation', function () {
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let app: Application;
  let server: ApolloServer<CMClass>;
  let url: string;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    // Mock Date.now() to get a consistent date for inserting data
    jest.useFakeTimers({
      now: updateDate,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
      advanceTimers: false,
    });
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
    await server.stop();
  });

  afterEach(() => jest.clearAllMocks());

  beforeEach(async () => {
    await writeDb('item_tags').truncate();
    await writeDb('item_tags').insert([
      {
        user_id: 1,
        item_id: 1,
        tag: 'summer',
        status: 1,
        time_added: date,
        time_updated: date,
        api_id: 'second_id',
        api_id_updated: 'updated_api_id',
      },
      {
        user_id: 1,
        item_id: 1,
        tag: 'zebra',
        status: 1,
        time_added: date1,
        time_updated: date1,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      },
      {
        user_id: 1,
        item_id: 0,
        tag: 'existing_tag',
        status: 1,
        time_added: date1,
        time_updated: date1,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      },
    ]);

    await writeDb('list').truncate();
    const inputData = [
      { item_id: 0, status: 1, favorite: 0 },
      { item_id: 1, status: 1, favorite: 0 },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date1,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
    });
    await writeDb('list').insert(inputData);
  });

  const createSavedItemTags = `
    mutation createSavedItemTags($input: [SavedItemTagsInput!]!, $timestamp: ISOString) {
      createSavedItemTags(input: $input, timestamp: $timestamp) {
        url
        _updatedAt
        tags {
          id
          name
        }
      }
    }
  `;

  it(
    'should be able to bulk update multiple tags for multiple savedItem' +
      'and return savedItems current state',
    async () => {
      const tagNames = ['🤪😒', '(╯°□°)╯︵ ┻━┻'];

      const variables = {
        input: [
          { savedItemId: '0', tags: tagNames },
          { savedItemId: '0', tags: [...tagNames, 'another_new_tag'] },
          { savedItemId: '1', tags: tagNames },
        ],
      };

      const res = await request(app)
        .post(url)
        .set(headers)
        .send({ query: createSavedItemTags, variables });

      const addedResult = [
        {
          id: '8J+kqvCfmJJfX3hwa3R4dGFneF9f',
          name: '🤪😒',
        },
        {
          id: 'KOKVr8Kw4pahwrAp4pWv77i1IOKUu+KUgeKUu19feHBrdHh0YWd4X18=',
          name: '(╯°□°)╯︵ ┻━┻',
        },
      ];

      const expectedTagsForSavedItemOne = [
        ...addedResult,
        {
          id: 'c3VtbWVyX194cGt0eHRhZ3hfXw==',
          name: 'summer',
        },
        {
          id: 'emVicmFfX3hwa3R4dGFneF9f',
          name: 'zebra',
        },
      ];

      const expectedTagsForSavedItemZero = [
        ...addedResult,
        {
          id: 'ZXhpc3RpbmdfdGFnX194cGt0eHRhZ3hfXw==',
          name: 'existing_tag',
        },
        {
          id: 'YW5vdGhlcl9uZXdfdGFnX194cGt0eHRhZ3hfXw==',
          name: 'another_new_tag',
        },
      ];

      expect(res).not.toBeUndefined();
      const data = res.body.data.createSavedItemTags;
      expect(data[0].url).toBe('http://0');
      expect(new Date(data[0]._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
      expect(data[0].tags.length).toBe(4);
      expect(data[0].tags).toContainAllValues(expectedTagsForSavedItemZero);
      expect(data[1].url).toBe('http://1');
      expect(new Date(data[1]._updatedAt * 1000)).toBeAfterOrEqualTo(
        updateDate,
      );
      expect(data[1].tags.length).toBe(4);
      expect(data[1].tags).toContainAllValues(expectedTagsForSavedItemOne);
    },
  );
  it('deduplicates based on item_id, user_id, and tag', async () => {
    const variables = {
      // dupe
      input: [{ savedItemId: '1', tags: ['summer'] }],
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: createSavedItemTags, variables });
    expect(res.body.data.createSavedItemTags.length).toBe(1);
    const { count } = await writeDb('item_tags')
      .count('*', { as: 'count' })
      .where({ user_id: headers.userid, item_id: '1', tag: 'summer' })
      .first();
    expect(count).toEqual(1);
  });

  it('createSavedItemTags should emit ADD_TAGS event on success', async () => {
    const variables = {
      input: [{ savedItemId: '1', tags: ['tofino', 'victoria'] }],
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: createSavedItemTags, variables });

    expect(res.body.errors).toBeUndefined();
    expect(eventSpy).toHaveBeenCalledTimes(1);
    const eventData = eventSpy.mock.calls[0];
    expect(eventData[0]).toBe(PocketEventType.ADD_TAGS);
    expect(eventData[1].id).toBe(1);
    expect(eventData[2]).toContainAllValues(['tofino', 'victoria']);
  });
  it('createSavedItemTags should set SavedItem._updatedAt to provided timestamp', async () => {
    const variables = {
      input: [{ savedItemId: '1', tags: ['tofino', 'victoria'] }],
      timestamp: '2024-03-21T23:35:14.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: createSavedItemTags, variables });
    const data = res.body.data.createSavedItemTags;
    expect(data[0]._updatedAt).toEqual(1711064114);
  });
  describe('connection management', () => {
    let contextConstructorSpy;
    beforeAll(() => {
      contextConstructorSpy = jest.spyOn(ContextModule, 'ContextManager');
    });
    afterAll(() => {
      contextConstructorSpy.mockRestore();
    });
    it('mutations resolver should initialize context with writeClient', async () => {
      const variables = {
        input: [{ savedItemId: '1', tags: ['tag', 'added'] }],
      };

      await request(app)
        .post(url)
        .set(headers)
        .send({ query: createSavedItemTags, variables });

      expect(contextConstructorSpy.mock.calls).toHaveLength(1);
      expect(
        contextConstructorSpy.mock.calls[0][0].dbClient.client.config
          .connection,
      ).toMatchObject({ user: 'pkt_listapi_w' });
    });
  });
});
