import { readClient, writeClient } from '../../../database/client';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import { EventType } from '../../../businessEvents';
import { UsersMetaService } from '../../../dataService';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import chaiDateTime from 'chai-datetime';
import { getUnixTimestamp } from '../../../utils';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

chai.use(deepEqualInAnyOrder);
chai.use(chaiDateTime);

describe('tags mutation: replace savedItem tags', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');

  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let clock;
  let logTagSpy;
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

  afterEach(() => sinon.resetHistory());

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    sinon.restore();
    clock.restore();
    await server.stop();
  });

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
        item_id: 1,
        tag: 'existing_tag',
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
      {
        user_id: 1,
        item_id: 0,
        tag: 'existing_tag_1',
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

  const replaceSavedItemTags = `
    mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!) {
      replaceSavedItemTags(input: $input) {
        url
        _updatedAt
        tags {
          id
          name
        }
      }
    }
  `;

  it('replacesSavedItemTags should replace tags for a given savedItem', async () => {
    const tagNames = ['🤪😒', '(╯°□°)╯︵ ┻━┻'];

    const variables = {
      input: [{ savedItemId: '1', tags: tagNames }],
    };

    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });

    const expectedTags = [
      {
        id: '8J+kqvCfmJJfX3hwa3R4dGFneF9f',
        name: '🤪😒',
      },
      {
        id: 'KOKVr8Kw4pahwrAp4pWv77i1IOKUu+KUgeKUu19feHBrdHh0YWd4X18=',
        name: '(╯°□°)╯︵ ┻━┻',
      },
    ];

    expect(res).is.not.undefined;
    const data = res.body.data.replaceSavedItemTags;
    expect(data[0].url).equals('http://1');
    expect(data[0]._updatedAt).equals(getUnixTimestamp(updateDate));
    expect(data[0].tags.length).to.equal(2);
    expect(data[0].tags).to.deep.equalInAnyOrder(expectedTags);
  });

  it('replacesSavedItemTags should replace tags for multiple savedItems', async () => {
    const tagNames = ['(╯°□°)╯︵ ┻━┻'];

    const variables = {
      input: [
        { savedItemId: '1', tags: tagNames },
        { savedItemId: '0', tags: tagNames },
      ],
    };

    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });

    const expectedTags = [
      {
        id: 'KOKVr8Kw4pahwrAp4pWv77i1IOKUu+KUgeKUu19feHBrdHh0YWd4X18=',
        name: '(╯°□°)╯︵ ┻━┻',
      },
    ];

    expect(res).is.not.undefined;
    expect(res.body.data.replaceSavedItemTags.length).to.equal(2);
    expect(res.body.data.replaceSavedItemTags).to.deep.equalInAnyOrder([
      {
        url: 'http://1',
        _updatedAt: getUnixTimestamp(updateDate),
        tags: expectedTags,
      },
      {
        url: 'http://0',
        _updatedAt: getUnixTimestamp(updateDate),
        tags: expectedTags,
      },
    ]);
  });

  it('replaceSavedItemTags should emit replace_tag event on success', async () => {
    const variables = {
      input: [{ savedItemId: '1', tags: ['tofino', 'victoria'] }],
    };

    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });

    expect(res.body.errors).to.be.undefined;
    expect(eventSpy.callCount).to.equal(1);
    const eventData = eventSpy.getCall(0).args;
    expect(eventData[0]).to.equal(EventType.REPLACE_TAGS);
    expect(eventData[1].id).equals(1);
    expect(eventData[2]).to.deep.equalInAnyOrder(['tofino', 'victoria']);
  });

  it('should be able to re-add tags along with new tags', async () => {
    const variables = {
      input: [
        {
          savedItemId: '0',
          tags: ['existing_tag', 'existing_tag_1', 'new_tag'],
        },
      ],
    };

    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });
    expect(res).is.not.undefined;
    expect(res.body.errors).to.be.undefined;
    expect(res.body.data.replaceSavedItemTags.length).to.equal(1);
    const tagsAdded = [];
    res.body.data.replaceSavedItemTags[0].tags.forEach((tag) =>
      tagsAdded.push(tag.name),
    );
    expect(tagsAdded).to.deep.equalInAnyOrder([
      'existing_tag',
      'existing_tag_1',
      'new_tag',
    ]);
  });
  it('replaceSavedItemTags should roll back if encounter an error during transaction', async () => {
    const listStateQuery = readDb('list').select();
    const tagStateQuery = readDb('item_tags').select();
    const metaStateQuery = readDb('users_meta').select();

    // Get the current db state
    const listState = await listStateQuery;
    const tagState = await tagStateQuery;
    const metaState = await metaStateQuery;

    logTagSpy = await sinon
      .stub(UsersMetaService.prototype, 'logTagMutation')
      .rejects(Error('server error'));

    const variables = {
      input: { savedItemId: '1', tags: ['helloWorld'] },
    };

    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });

    expect(res.body.errors.length).to.equal(1);
    expect(res.body.errors[0].extensions.code).equals('INTERNAL_SERVER_ERROR');
    expect(await listStateQuery).to.deep.equalInAnyOrder(listState);
    expect(await tagStateQuery).to.deep.equalInAnyOrder(tagState);
    expect(await metaStateQuery).to.deep.equalInAnyOrder(metaState);
    logTagSpy.restore();
  });
  it('should not allow an empty tag', async () => {
    const variables = {
      input: { savedItemId: '1', tags: ['helloWorld', ''] },
    };
    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });
    expect(res.body.errors.length).to.equal(1);
    expect(res.body.errors[0].message).contains(
      'Tag name must have at least 1 non-whitespace character.',
    );
    expect(res.body.errors[0].extensions?.code).to.equal('BAD_USER_INPUT');
  });
});
