import { readClient, writeClient } from '../../../database/client';
import { UsersMetaService } from '../../../dataService';
import { mysqlTimeString } from '../../../dataService/utils';
import config from '../../../config';
import { EventType } from '../../../businessEvents';
import { getUnixTimestamp } from '../../../utils';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('tags mutation update: ', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const headers = { userid: '1' };
  const date = new Date('2020-10-03 10:20:30'); // Consistent date for seeding
  const unixDate = getUnixTimestamp(date);
  const date1 = new Date('2020-10-03 10:30:30'); // Consistent date for seeding
  const updateDate = new Date(2021, 1, 1, 0, 0); // mock date for insert
  let logTagSpy: jest.SpyInstance;
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });

  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    await server.stop();
  });

  afterEach(() => jest.clearAllMocks());

  beforeEach(async () => {
    // Mock Date.now() to get a consistent date for inserting body.data
    jest.useFakeTimers({
      now: updateDate,
      advanceTimers: true,
    });
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

  const updateSavedItemTags = `
    mutation updateSavedItemTags($input: SavedItemTagUpdateInput!) {
      updateSavedItemTags(input: $input) {
        url
        _createdAt
        _updatedAt
        tags {
          id
          name
        }
      }
    }
  `;

  const updateSavedItemRemoveTags = `
    mutation updateSavedItemRemoveTags($savedItemId: ID!) {
      updateSavedItemRemoveTags(savedItemId: $savedItemId) {
        id
        url
        _createdAt
        _updatedAt
        tags {
          name
        }
      }
    }
  `;

  it('updateSavedItemTags should update tags for a given savedItems', async () => {
    const happyPathTagNames = ['changed_name', '🤪😒', '(╯°□°)╯︵ ┻━┻'];
    const happyPathTagIds: string[] = happyPathTagNames.map((tagName) =>
      Buffer.from(tagName).toString('base64'),
    );

    const variables = {
      input: { savedItemId: '1', tagIds: happyPathTagIds },
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemTags,
      variables,
    });

    const expectedTags = [
      {
        id: 'Y2hhbmdlZF9uYW1lX194cGt0eHRhZ3hfXw==',
        name: 'changed_name',
      },
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
    expect(res.body.data.updateSavedItemTags.url).toEqual('http://1');
    expect(res.body.data.updateSavedItemTags._createdAt).toEqual(unixDate);
    expect(res.body.data.updateSavedItemTags._updatedAt).toEqual(
      getUnixTimestamp(updateDate),
    );
    expect(res.body.data.updateSavedItemTags.tags).toContainAllValues(
      expectedTags,
    );
  });

  it(' updateSavedItemTags should emit replace_tag event on success', async () => {
    const tofino = Buffer.from('tofino').toString('base64');
    const victoria = Buffer.from('victoria').toString('base64');
    const variables = {
      input: { savedItemId: '1', tagIds: [tofino, victoria] },
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemTags,
      variables,
    });
    expect(res.body.errors).toBeUndefined();

    expect(eventSpy).toHaveBeenCalledTimes(1);
    const eventData = eventSpy.mock.calls[0];
    expect(eventData[0]).toEqual(EventType.REPLACE_TAGS);
    expect(eventData[1].id).toEqual(1);
    expect(eventData[2]).toContainAllValues(['tofino', 'victoria']);
  });

  it('updateSavedItemTags should throw NOT_FOUND error if itemId doesnt exist', async () => {
    const variables = {
      input: { savedItemId: '13', tagIds: ['TagB'] },
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemTags,
      variables,
    });

    expect(res).not.toBeUndefined();
    expect(res.body.errors[0].message).toContain(
      `SavedItem ID ${variables.input.savedItemId} does not exist`,
    );
    expect(res.body.errors[0].extensions.code).toEqual('NOT_FOUND');
  });

  it('updateSavedItemTags should throw error when tagIds are empty', async () => {
    const variables = {
      input: { savedItemId: '1', tagIds: [] },
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemTags,
      variables,
    });

    expect(res).not.toBeUndefined();
    expect(res.body.errors[0].message).toContain(
      'Must provide 1 or more values for tag mutations',
    );
    expect(res.body.errors[0].extensions.code).toEqual('BAD_USER_INPUT');
  });

  it('updateSavedItemTags : should log the tag mutation', async () => {
    const variables = {
      input: { savedItemId: '1', tagIds: ['helloWorld'] },
    };

    await request(app).post(url).set(headers).send({
      query: updateSavedItemTags,
      variables,
    });

    const res = await readDb('users_meta')
      .where({ user_id: '1', property: 18 })
      .pluck('value');

    expect(res[0]).toEqual(mysqlTimeString(updateDate, config.database.tz));
  });

  it('updateSavedItemTags : should roll back if encounter an error during transaction', async () => {
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
      input: { savedItemId: '1', tagIds: ['helloWorld'] },
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemTags,
      variables,
    });

    expect(res.body.errors.length).toEqual(1);
    expect(res.body.errors[0].extensions.code).toEqual(`INTERNAL_SERVER_ERROR`);
    expect(await listStateQuery).toContainAllValues(listState);
    expect(await tagStateQuery).toContainAllValues(tagState);
    expect(await metaStateQuery).toContainAllValues(metaState);
    logTagSpy.mockRestore();
  });

  it('updateSavedItemRemoveTags: should remove all tags for a given savedItemId', async () => {
    const variables = {
      savedItemId: '1',
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemRemoveTags,
      variables,
    });

    expect(res).not.toBeUndefined();
    expect(res.body.data.updateSavedItemRemoveTags.url).toEqual('http://1');
    expect(res.body.data.updateSavedItemRemoveTags._createdAt).toEqual(
      unixDate,
    );
    expect(res.body.data.updateSavedItemRemoveTags._updatedAt).toEqual(
      getUnixTimestamp(updateDate),
    );
    expect(res.body.data.updateSavedItemRemoveTags.tags).toBeEmpty();
  });

  it('updateSavedItemRemoveTags : should throw not found error if savedItemId doesnt exist', async () => {
    const variables = {
      savedItemId: '13',
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemRemoveTags,
      variables,
    });

    expect(res.body.errors).not.toBeUndefined();
    expect(res.body.errors[0].message).toContain(
      `SavedItem Id ${variables.savedItemId} does not exist`,
    );
    expect(res.body.errors[0].extensions.code).toEqual('NOT_FOUND');
  });

  it('updateSavedItemRemoveTags : should log the tag mutation', async () => {
    const variables = {
      savedItemId: '1',
    };

    await request(app).post(url).set(headers).send({
      query: updateSavedItemRemoveTags,
      variables,
    });

    const res = await readDb('users_meta')
      .where({ user_id: '1', property: 18 })
      .pluck('value');
    expect(res[0]).toEqual(mysqlTimeString(updateDate, config.database.tz));
  });

  it(' updateSavedItemRemoveTags: should emit clear_tag event on success', async () => {
    const variables = {
      savedItemId: '1',
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemRemoveTags,
      variables,
    });

    expect(res.body.errors).toBeUndefined();

    expect(eventSpy).toHaveBeenCalledTimes(1);
    const eventData = eventSpy.mock.calls[0];
    expect(eventData[0]).toEqual(EventType.CLEAR_TAGS);
    expect(eventData[1].id).toEqual(1);
    expect(eventData[2]).toContainAllValues([
      'summer',
      'zebra',
      'existing_tag',
    ]);
  });

  it('updateSavedItemRemoveTags : should roll back if encounter an error during transaction', async () => {
    const listStateQuery = readDb('list').select();
    const tagStateQuery = readDb('item_tags').select();
    const metaStateQuery = readDb('users_meta').select();

    // Get the current db state
    const listState = await listStateQuery;
    const tagState = await tagStateQuery;
    const metaState = await metaStateQuery;

    logTagSpy = jest
      .spyOn(UsersMetaService.prototype, 'logTagMutation')
      .mockClear()
      .mockImplementation(() => {
        throw new Error('server error');
      });

    const variables = {
      savedItemId: '1',
    };

    const res = await request(app).post(url).set(headers).send({
      query: updateSavedItemRemoveTags,
      variables,
    });

    expect(res.body.errors.length).toEqual(1);
    expect(res.body.errors[0].extensions.code).toEqual('INTERNAL_SERVER_ERROR');
    expect(await listStateQuery).toContainAllValues(listState);
    expect(await tagStateQuery).toContainAllValues(tagState);
    expect(await metaStateQuery).toContainAllValues(metaState);
    logTagSpy.mockRestore();
  });
});
