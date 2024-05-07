import Client from '../../database/client.js';
import { SavedItemDataService } from '../../dataService/index.js';
import { ContextManager } from '../../server/context.js';

describe('SavedItemsService', () => {
  const db = Client.writeClient();
  const date = new Date('2020-10-03 10:20:30');

  beforeAll(async () => {
    await db('list').truncate();
    await db('list').insert([
      {
        user_id: 1,
        item_id: 1,
        resolved_id: 1,
        given_url: 'https://abc',
        title: 'my title',
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 0,
        favorite: 1,
        api_id_updated: 'apiid',
      },
      {
        user_id: 1,
        item_id: 2,
        resolved_id: 2,
        given_url: 'https://def',
        title: 'my title2',
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        status: 2,
        favorite: 1,
        api_id_updated: 'apiid',
      },
    ]);
  });

  afterAll(async () => {
    await db.destroy();
    await Client.readClient().destroy();
  });

  it('fetches saved items for multiple urls for the same user', async () => {
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      },
      dbClient: Client.readClient(),
      eventEmitter: null,
    });

    const savedItems = await new SavedItemDataService(
      context,
    ).batchGetSavedItemsByGivenUrls(['https://abc', 'https://def']);

    expect(savedItems[0].url).toStrictEqual('https://abc');
    expect(savedItems[1].url).toStrictEqual('https://def');
  });

  it('fetches saved items for multiple ids for the same user', async () => {
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      },
      dbClient: Client.readClient(),
      eventEmitter: null,
    });

    const savedItems = await new SavedItemDataService(
      context,
    ).batchGetSavedItemsByGivenIds(['1', '2']);

    expect(savedItems[0].url).toStrictEqual('https://abc');
    expect(savedItems[1].url).toStrictEqual('https://def');
  });

  it('fetches saved item IDs up to a given limit', async () => {
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      },
      dbClient: Client.readClient(),
      eventEmitter: null,
    });

    const savedItemIds = await new SavedItemDataService(
      context,
    ).getSavedItemIds(0, 1);

    expect(savedItemIds[0]).toStrictEqual(1);
  });

  it('fetches saved item IDs up to a given limit starting from a given offset', async () => {
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      },
      dbClient: Client.readClient(),
      eventEmitter: null,
    });

    const savedItemIds = await new SavedItemDataService(
      context,
    ).getSavedItemIds(1, 1);

    expect(savedItemIds[0]).toStrictEqual(2);
  });

  it('returns an empty list if the offset is past the end of the list', async () => {
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      },
      dbClient: Client.readClient(),
      eventEmitter: null,
    });

    const savedItemIds = await new SavedItemDataService(
      context,
    ).getSavedItemIds(4, 1);

    expect(savedItemIds.length).toStrictEqual(0);
  });
  describe('.deleteSavedItem', () => {
    const itemId = 1;
    const query = async (tableName: string) =>
      await db(tableName)
        .select()
        .where({ user_id: 1, item_id: itemId })
        .first();
    beforeAll(async () => {
      await db('item_attribution').truncate();
      await db('items_scroll').truncate();
      await db('item_attribution').insert([
        {
          user_id: 1,
          item_id: itemId,
          attribution_type_id: 101,
        },
      ]);
      await db('items_scroll').insert({
        user_id: 1,
        item_id: itemId,
        view: 1,
        section: 0,
        page: 1,
        node_index: 10,
        scroll_percent: 10,
        time_updated: date,
        updated_at: date,
      });
    });
    it('deletes from non-client-facing tables', async () => {
      const context = new ContextManager({
        request: {
          headers: { userid: '1', apiid: '0' },
        },
        dbClient: Client.writeClient(),
        eventEmitter: null,
      });
      await new SavedItemDataService(context).deleteSavedItem(itemId);
      // Adding coverage for data not made available through the API
      expect(await query('item_attribution')).toBeUndefined();
      expect(await query('items_scroll')).toBeUndefined();
    });
  });
});
