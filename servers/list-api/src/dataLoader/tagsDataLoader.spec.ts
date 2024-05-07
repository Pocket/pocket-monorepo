import { batchGetTagsByItemIds } from './tagsDataLoader.js';
import { writeClient } from '../database/client.js';
import { SavedItemDataService, TagDataService } from '../dataService/index.js';
import { ContextManager, IContext } from '../server/context.js';
import { Tag } from '../types/index.js';
import { jest } from '@jest/globals';

describe('tags dataloader', function () {
  const testTags: { [savedItemId: string]: Tag[] } = {
    '1': [
      {
        id: '1',
        name: 'tag1',
      },
      {
        id: '2',
        name: 'tag2',
      },
    ],
    '2': [
      {
        id: '2',
        name: 'tag2',
      },
    ],
  };

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeAll(() => {
    jest.restoreAllMocks();
  });

  it('batchGetTagsByItemIds should return empty array of Tags for non-existant Items', async () => {
    const promiseTags = Promise.resolve(testTags);
    const db = writeClient();
    const context: IContext = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0', premium: 'true' },
      },
      dbClient: db,
      eventEmitter: null,
    });
    const savedItemService = new SavedItemDataService(context);
    const service = new TagDataService(context, savedItemService);
    jest
      .spyOn(service, 'batchGetTagsByUserItems')
      .mockClear()
      .mockReturnValue(promiseTags);
    const tags = await batchGetTagsByItemIds(service, ['3', '5']);

    // dataloader wants an array that is the same length
    // of array of args passed in, e.g. number of Item IDs -
    // (this is how it matches up results to batched inputs)
    expect(tags).toHaveLength(2);
    // there are no items with the first given tag;
    expect(tags[0]).toHaveLength(0);
    // there are no items with the second given tag;
    expect(tags[1]).toHaveLength(0);
  });

  it('batchGetTagsByItemIds should return array of Tags & empty array for mix of existing & non-existing Item IDs', async () => {
    const promiseTags = Promise.resolve(testTags);
    const db = writeClient();
    const context: IContext = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0', premium: 'true' },
      },
      dbClient: db,
      eventEmitter: null,
    });
    const savedItemService = new SavedItemDataService(context);
    const service = new TagDataService(context, savedItemService);
    jest
      .spyOn(service, 'batchGetTagsByUserItems')
      .mockClear()
      .mockReturnValue(promiseTags);
    const tags = await batchGetTagsByItemIds(service, ['1', '3']);

    // dataloader wants an array that is the same length
    // of array of args passed in
    // (this is how it matches up results to batched inputs)
    expect(tags).toHaveLength(2);
    // there are 2 items with the first given tag;
    expect(tags[0]).toHaveLength(2);
    expect(tags[0]).toContainEqual({
      id: '1',
      name: 'tag1',
    });
    expect(tags[0]).toContainEqual({
      id: '2',
      name: 'tag2',
    });
    // there are no items with the second given tag;
    expect(tags[1]).toHaveLength(0);
  });

  it('batchGetTagsByItemIds can handle ItemIDs given as int or number instead of string', async () => {
    const promiseTags = Promise.resolve(testTags);
    const db = writeClient();
    const context: IContext = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0', premium: 'true' },
      },
      dbClient: db,
      eventEmitter: null,
    });
    const savedItemService = new SavedItemDataService(context);
    const service = new TagDataService(context, savedItemService);
    jest
      .spyOn(service, 'batchGetTagsByUserItems')
      .mockClear()
      .mockReturnValue(promiseTags);
    const badItemIdsArray: any[] = [1, '3'];
    const tags = await batchGetTagsByItemIds(service, badItemIdsArray);

    // dataloader wants an array that is the same length
    // of array of args passed in
    // (this is how it matches up results to batched inputs)
    expect(tags).toHaveLength(2);
    // there are 2 items with the first given tag;
    expect(tags[0]).toHaveLength(2);
    expect(tags[0]).toContainEqual({
      id: '1',
      name: 'tag1',
    });
    expect(tags[0]).toContainEqual({
      id: '2',
      name: 'tag2',
    });
    // there are no items with the second given tag;
    expect(tags[1]).toHaveLength(0);
  });
});
