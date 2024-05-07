import Client from '../../../../database/client.js';
import { EventType } from '../../../../businessEvents/index.js';
import { UsersMetaService } from '../../../../dataService/index.js';
import { getUnixTimestamp } from '../../../../utils.js';
import { ContextManager } from '../../../../server/context.js';
import { startServer } from '../../../../server/apollo.js';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { jest } from '@jest/globals';
import { SpyInstance } from 'jest-mock';

describe('tags mutation: replace savedItem tags', () => {
  const writeDb = Client.writeClient();
  const readDb = Client.readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');

  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let logTagSpy: SpyInstance;
  let app: Application;
  let server: ApolloServer<ContextManager>;
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

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
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
    mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!, $timestamp: ISOString) {
      replaceSavedItemTags(input: $input, timestamp: $timestamp) {
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

    expect(res).not.toBeUndefined();
    const data = res.body.data.replaceSavedItemTags;
    expect(data[0].url).toEqual('http://1');
    expect(data[0]._updatedAt).toEqual(getUnixTimestamp(updateDate));
    expect(data[0].tags.length).toEqual(2);
    expect(data[0].tags).toContainAllValues(expectedTags);
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

    expect(res).not.toBeUndefined();
    expect(res.body.data.replaceSavedItemTags.length).toEqual(2);
    expect(res.body.data.replaceSavedItemTags).toContainAllValues([
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

    expect(res.body.errors).toBeUndefined();
    expect(eventSpy).toHaveBeenCalledTimes(1);
    const eventData = eventSpy.mock.calls[0];
    expect(eventData[0]).toEqual(EventType.REPLACE_TAGS);
    expect(eventData[1].id).toEqual(1);
    expect(eventData[2]).toContainAllValues(['tofino', 'victoria']);
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
    expect(res).not.toBeUndefined();
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.replaceSavedItemTags.length).toEqual(1);
    const tagsAdded = [];
    res.body.data.replaceSavedItemTags[0].tags.forEach((tag) =>
      tagsAdded.push(tag.name),
    );
    expect(tagsAdded).toContainAllValues([
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

    logTagSpy = jest
      .spyOn(UsersMetaService.prototype, 'logTagMutation')
      .mockImplementation(() => {
        throw new Error('server error');
      });

    const variables = {
      input: { savedItemId: '1', tags: ['helloWorld'] },
    };

    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });

    expect(res.body.errors.length).toEqual(1);
    expect(res.body.errors[0].extensions.code).toEqual('INTERNAL_SERVER_ERROR');
    expect(await listStateQuery).toContainAllValues(listState);
    expect(await tagStateQuery).toContainAllValues(tagState);
    expect(await metaStateQuery).toContainAllValues(metaState);
    logTagSpy.mockRestore();
  });
  it('should not allow an empty tag', async () => {
    const variables = {
      input: { savedItemId: '1', tags: ['helloWorld', ''] },
    };
    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });
    expect(res.body.errors.length).toEqual(1);
    expect(res.body.errors[0].message).toContain(
      'Tag name must have at least 1 non-whitespace character.',
    );
    expect(res.body.errors[0].extensions?.code).toEqual('BAD_USER_INPUT');
  });
  it('should set SavedItem._updatedAt to provided timestamp', async () => {
    const tagNames = ['🤪😒', '(╯°□°)╯︵ ┻━┻'];

    const variables = {
      input: [
        {
          savedItemId: '1',
          tags: tagNames,
        },
      ],
      timestamp: '2024-03-21T23:35:14.000Z',
    };

    const res = await request(app).post(url).set(headers).send({
      query: replaceSavedItemTags,
      variables,
    });

    expect(res).not.toBeUndefined();
    const data = res.body.data.replaceSavedItemTags;
    expect(data[0]._updatedAt).toEqual(1711064114);
  });
});
