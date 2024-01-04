import { writeClient } from '../../../database/client';
import { EventType } from '../../../businessEvents';
import sinon from 'sinon';
import { getUnixTimestamp } from '../../../utils';
import chai, { expect } from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import chaiDateTime from 'chai-datetime';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import * as Client from '../../../database/client';

chai.use(deepEqualInAnyOrder);
chai.use(chaiDateTime);

describe('createSavedItemTags mutation', function () {
  const db = writeClient();
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');
  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let clock;
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    // Mock Date.now() to get a consistent date for inserting data
    clock = sinon.useFakeTimers({
      now: updateDate,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
    });
  });

  afterAll(async () => {
    await db.destroy();
    clock.restore();
    sinon.restore();
    await server.stop();
  });

  afterEach(() => sinon.resetHistory());

  beforeEach(async () => {
    await db('item_tags').truncate();
    await db('item_tags').insert([
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

    await db('list').truncate();
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
    await db('list').insert(inputData);
  });

  const createSavedItemTags = `
    mutation createSavedItemTags($input: [SavedItemTagsInput!]!) {
      createSavedItemTags(input: $input) {
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

      expect(res).is.not.undefined;
      const data = res.body.data.createSavedItemTags;
      expect(data[0].url).equals('http://0');
      expect(data[0]._updatedAt).equals(getUnixTimestamp(updateDate));
      expect(data[0].tags.length).to.equal(4);
      expect(data[0].tags).to.deep.equalInAnyOrder(
        expectedTagsForSavedItemZero,
      );

      expect(data[1].url).equals('http://1');
      expect(data[1]._updatedAt).equals(getUnixTimestamp(updateDate));
      expect(data[1].tags.length).to.equal(4);
      expect(data[1].tags).to.deep.equalInAnyOrder(expectedTagsForSavedItemOne);
    },
  );

  it('createSavedItemTags should emit ADD_TAGS event on success', async () => {
    const variables = {
      input: [{ savedItemId: '1', tags: ['tofino', 'victoria'] }],
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: createSavedItemTags, variables });

    expect(res.body.errors).to.be.undefined;
    expect(eventSpy.callCount).to.equal(1);
    const eventData = eventSpy.getCall(0).args;
    expect(eventData[0]).to.equal(EventType.ADD_TAGS);
    expect(eventData[1].id).equals(1);
    expect(eventData[2]).to.deep.equalInAnyOrder(['tofino', 'victoria']);
  });

  it('mutations resolver chains should call only writeClient()', async () => {
    const variables = {
      input: [{ savedItemId: '1', tags: ['tag', 'added'] }],
    };

    const readClientSpy = sinon.spy(Client, 'readClient');
    const writeClientSpy = sinon.spy(Client, 'writeClient');
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: createSavedItemTags, variables });

    expect(res.body.errors).to.be.undefined;
    expect(readClientSpy.callCount).to.equal(0);
    expect(writeClientSpy.callCount).to.equal(1);
  });
});
