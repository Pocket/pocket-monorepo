import {
  PocketSaveDataService,
  SavedItemDataService,
  TagDataService,
} from '../../dataService/index.js';
import Client from '../../database/client.js';
import { ItemResponse } from '../../externalCaller/parserCaller.js';
import { SavedItemUpsertInput } from '../../types/index.js';
import { expect } from '@jest/globals';
import unleashClient from '../../featureFlags/mockClient.js';
import config from '../../config/index.js';
import { ContextManager } from '../../server/context.js';

function areBothNaN(a, b) {
  if (isNaN(a) && isNaN(b)) {
    return true;
  } else if (isNaN(a) || isNaN(b)) {
    return false;
  } else {
    return undefined;
  }
}

expect.addEqualityTesters([areBothNaN]);

describe('List API mirroring', () => {
  const db = Client.writeClient();
  const date = new Date();
  const epochDate = date.getTime() / 1000;
  const unleash = unleashClient([
    {
      enabled: true,
      name: config.unleash.flags.mirrorWrites.name,
      stale: false,
      type: 'release',
      project: 'default',
      variants: [],
      strategies: [],
      impressionData: false,
    },
  ]);
  const context = new ContextManager({
    request: {
      headers: { userid: '1', apiid: '777', premium: 'true' },
    },
    dbClient: db,
    eventEmitter: null,
    unleash,
  });
  const savedItemService = new SavedItemDataService(context);
  const pocketSaveService = new PocketSaveDataService(context);
  const tagService = new TagDataService(context, savedItemService);

  const fetchRow = (itemId: string, tableName: string) => {
    return db(tableName)
      .select('*')
      .where({ user_id: 1, item_id: itemId })
      .first();
  };

  beforeEach(async () => {
    await db('list').truncate();
    await db('list_schema_update').truncate();
    await db('item_tags').truncate();
    const listSeed = {
      item_id: 1,
      status: 0,
      favorite: 0,
      user_id: 1,
      resolved_id: 1,
      given_url: 'http://1',
      title: 'title 1',
      time_added: date,
      time_updated: date,
      time_read: '0000-00-00 00:00:00',
      time_favorited: '0000-00-00 00:00:00',
      api_id: '777',
      api_id_updated: '777',
    };
    const shadowSeed = {
      item_id: 999,
      status: 0,
      favorite: 1,
      user_id: 1,
      resolved_id: 999,
      given_url: 'http://999',
      title: 'title 999',
      time_added: date,
      time_updated: date,
      time_read: '0000-00-00 00:00:00',
      time_favorited: date,
      api_id: '777',
      api_id_updated: '777',
    };
    const baseTag = {
      user_id: 1,
      status: 1,
      api_id: '777',
      api_id_updated: '777',
      time_added: date,
      time_updated: date,
    };
    const tagSeed = [
      {
        ...baseTag,
        item_id: 1,
        tag: 'the first and forsaken lion',
      },
      {
        ...baseTag,
        item_id: 1,
        tag: 'the eye and seven despairs',
      },
      {
        ...baseTag,
        item_id: 999,
        tag: 'the eye and seven despairs',
      },
    ];
    await db('list').insert([shadowSeed, listSeed]);
    await db('list_schema_update').insert(shadowSeed);
    await db('item_tags').insert(tagSeed);
  });
  afterAll(async () => {
    await db('list').truncate();
    await db('list_schema_update').truncate();
    await db('item_tags').truncate();
    unleash.destroy();
  });
  it('works for fields with zero-dates', async () => {
    const seedItem: ItemResponse = {
      itemId: '2',
      resolvedId: '2',
      title: 'title 2',
    };
    const seedSave: SavedItemUpsertInput = {
      url: 'http://2',
      isFavorite: false,
      timestamp: epochDate,
    };
    await savedItemService.upsertSavedItem(seedItem, seedSave);
    const listResult = await fetchRow('2', 'list');
    const shadowResult = await fetchRow('2', 'list_schema_update');
    expect(listResult).not.toBeNull();
    expect(listResult).toStrictEqual(shadowResult);
  });
  it('Copies new rows to shadow table on create', async () => {
    const seedItem: ItemResponse = {
      itemId: '2',
      resolvedId: '2',
      title: 'title 2',
    };
    const seedSave: SavedItemUpsertInput = {
      url: 'http://2',
      isFavorite: true,
      timestamp: epochDate,
    };
    await savedItemService.upsertSavedItem(seedItem, seedSave);
    const listResult = await fetchRow('2', 'list');
    const shadowResult = await fetchRow('2', 'list_schema_update');
    expect(listResult).not.toBeUndefined();
    expect(shadowResult).not.toBeUndefined();
    expect(listResult).toStrictEqual(shadowResult);
  });
  it('Merges changes to shadow table for rows that already exist', async () => {
    await savedItemService.updateSavedItemArchiveProperty('999', true);
    const listResult = await fetchRow('999', 'list');
    const shadowResult = await fetchRow('999', 'list_schema_update');
    expect(listResult).not.toBeUndefined();
    expect(shadowResult).not.toBeUndefined();
    expect(listResult.status).toEqual(1);
    expect(listResult).toStrictEqual(shadowResult);
  });
  it.each([
    {
      property: 'favorite - savedItem',
      method: () =>
        savedItemService.updateSavedItemFavoriteProperty('1', true, date),
    },
    {
      property: 'archived - savedItem',
      method: () =>
        savedItemService.updateSavedItemArchiveProperty('1', true, date),
    },
    {
      property: 'deleted - savedItem',
      method: () => savedItemService.deleteSavedItem('1', date),
    },
    {
      property: 'undeleted - savedItem',
      method: () => savedItemService.updateSavedItemUnDelete('1', date),
    },
    {
      property: 'favorite - pocketSave',
      method: () => pocketSaveService.favoriteListRow([1], date),
    },
    {
      property: 'archived - pocketSave',
      method: () => pocketSaveService.archiveListRow([1], date),
    },
    {
      property: 'tags - insert',
      method: () =>
        tagService.insertTags(
          [
            {
              savedItemId: '1',
              name: 'the lover clad in the raiment of tears',
            },
            { savedItemId: '999', name: 'the mask of winters' },
          ],
          date,
        ),
    },
    {
      property: 'tags - delete associations',
      method: () =>
        tagService.deleteSavedItemAssociations([
          {
            savedItemId: '1',
            tagName: 'the first and forsaken lion',
          },
          {
            savedItemId: '999',
            tagName: 'the eye and seven despairs',
          },
        ]),
    },
    {
      property: 'tags - rename tag',
      method: () =>
        tagService.updateTagByUser(
          'the eye and seven despairs',
          'the black heron',
          ['1', '999'],
        ),
    },
    {
      property: 'tags - update/replace tags',
      method: () =>
        tagService.updateSavedItemTags([
          {
            name: 'the bishop of the chalcedony thurible',
            savedItemId: '1',
          },
        ]),
    },
    {
      property: 'tags - remove all tags',
      method: () => tagService.updateSavedItemRemoveTags('1'),
    },
    {
      property: 'tags - replace tags',
      method: () =>
        tagService.replaceSavedItemTags([
          {
            name: 'the dowager of the irreverent vulgate in unrent veils',
            savedItemId: '1',
          },
        ]),
    },
    {
      property: 'tags - bulk update',
      method: () =>
        tagService.batchUpdateTags(
          {
            deletes: [], // Deleting actually doesn't trigger the save row update... maybe a bug?
            creates: [{ savedItemId: '1', name: 'the silver prince' }],
          },
          date,
        ),
    },
    // No deleted/undeleted properties for pocketSave
  ])(
    'Copies new rows to shadow table on update: $property',
    async ({ method }) => {
      const preOperationResult = await fetchRow('1', 'list_schema_update');
      expect(preOperationResult).toBeUndefined();
      await method();
      const listResult = await fetchRow('1', 'list');
      const shadowResult = await fetchRow('1', 'list_schema_update');
      expect(listResult).not.toBeUndefined();
      expect(shadowResult).not.toBeUndefined();
      expect(listResult).toStrictEqual(shadowResult);
    },
  );
  describe('with feature flag disabled', () => {
    const disabledUnleash = unleashClient([
      {
        enabled: false,
        name: config.unleash.flags.mirrorWrites.name,
        stale: false,
        type: 'release',
        project: 'default',
        variants: [],
        strategies: [],
        impressionData: false,
      },
    ]);
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '777', premium: 'true' },
      },
      dbClient: db,
      eventEmitter: null,
      unleash: disabledUnleash,
    });
    const saveServiceNoSync = new SavedItemDataService(context);
    const pocketServiceNoSync = new PocketSaveDataService(context);
    const tagServiceNoSync = new TagDataService(context, saveServiceNoSync);
    const upsertSeed: { item: ItemResponse; save: SavedItemUpsertInput } = {
      item: {
        itemId: '1',
        resolvedId: '1',
        title: 'title 1',
      },
      save: {
        url: 'http://1',
        isFavorite: false,
        timestamp: epochDate,
      },
    };
    it.each([
      {
        property: 'upsert - savedItem',
        method: () =>
          saveServiceNoSync.upsertSavedItem(upsertSeed.item, upsertSeed.save),
      },
      {
        property: 'favorite - savedItem',
        method: () =>
          saveServiceNoSync.updateSavedItemFavoriteProperty('1', true, date),
      },
      {
        property: 'archived - savedItem',
        method: () =>
          saveServiceNoSync.updateSavedItemArchiveProperty('1', true, date),
      },
      {
        property: 'deleted - savedItem',
        method: () => saveServiceNoSync.deleteSavedItem('1', date),
      },
      {
        property: 'undeleted - savedItem',
        method: () => saveServiceNoSync.updateSavedItemUnDelete('1', date),
      },
      {
        property: 'favorite - pocketSave',
        method: () => pocketServiceNoSync.favoriteListRow([1], date),
      },
      {
        property: 'archived - pocketSave',
        method: () => pocketServiceNoSync.archiveListRow([1], date),
      },
      {
        property: 'tags - insert',
        method: () =>
          tagServiceNoSync.insertTags(
            [
              {
                savedItemId: '1',
                name: 'the lover clad in the raiment of tears',
              },
              { savedItemId: '999', name: 'the mask of winters' },
            ],
            date,
          ),
      },
      {
        property: 'tags - delete associations',
        method: () =>
          tagServiceNoSync.deleteSavedItemAssociations([
            {
              savedItemId: '1',
              tagName: 'the first and forsaken lion',
            },
            {
              savedItemId: '999',
              tagName: 'the eye and seven despairs',
            },
          ]),
      },
      {
        property: 'tags - rename tag',
        method: () =>
          tagServiceNoSync.updateTagByUser(
            'the eye and seven despairs',
            'the black heron',
            ['1', '999'],
          ),
      },
      {
        property: 'tags - update/replace tags',
        method: () =>
          tagServiceNoSync.updateSavedItemTags([
            {
              name: 'the bishop of the chalcedony thurible',
              savedItemId: '1',
            },
          ]),
      },
      {
        property: 'tags - remove all tags',
        method: () => tagServiceNoSync.updateSavedItemRemoveTags('1'),
      },
      {
        property: 'tags - replace tags',
        method: () =>
          tagServiceNoSync.replaceSavedItemTags([
            {
              name: 'the dowager of the irreverent vulgate in unrent veils',
              savedItemId: '1',
            },
          ]),
      },
      {
        property: 'tags - bulk update',
        method: () =>
          tagServiceNoSync.batchUpdateTags(
            {
              deletes: [], // Deleting actually doesn't trigger the save row update... maybe a bug?
              creates: [{ savedItemId: '1', name: 'the silver prince' }],
            },
            date,
          ),
      },
      // No deleted/undeleted properties for pocketSave
    ])(
      'Does not sync when feature flag is disabled: $property',
      async ({ method }) => {
        const preOperationResult = await fetchRow('1', 'list_schema_update');
        expect(preOperationResult).toBeUndefined();
        await method();
        const listResult = await fetchRow('1', 'list');
        const shadowResult = await fetchRow('1', 'list_schema_update');
        expect(listResult).not.toBeUndefined();
        expect(shadowResult).toBeUndefined();
      },
    );
  });
});
