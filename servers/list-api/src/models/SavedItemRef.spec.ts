import { SavedItemDataService } from '../dataService';
import { ContextManager } from '../server/context';
import { SavedItem } from '../types';
import { SavedItemRef } from './SavedItemRef';

describe('SavedItemRef', () => {
  afterEach(() => jest.restoreAllMocks());
  const context = new ContextManager({
    request: {
      headers: { userid: '1', apiid: '0' },
    },
    dbClient: jest.fn() as any,
    eventEmitter: null,
  });
  it('throws BadUserInput error if neither id nor url are provided', async () => {
    expect.assertions(2);
    try {
      await SavedItemRef.resolve({}, context);
    } catch (err) {
      expect(err.message).toContain(`Must provide one of either 'id' or 'url'`);
      expect(err.extensions.code).toEqual('BAD_USER_INPUT');
    }
  });
  it('resolves url if id was provided', async () => {
    jest
      .spyOn(SavedItemDataService.prototype, 'getSavedItemById')
      .mockResolvedValue({ url: 'http://domain.com' } as SavedItem);
    const save = await SavedItemRef.resolve({ id: '12345' }, context);
    expect(save.id).toEqual('12345');
    expect(save.url).toEqual('http://domain.com');
  });
  it('resolves id if url was provided', async () => {
    jest
      .spyOn(SavedItemDataService.prototype, 'getSavedItemByGivenUrl')
      .mockResolvedValue({ id: '12345' } as SavedItem);
    const save = await SavedItemRef.resolve(
      { url: 'http://domain.com' },
      context,
    );
    expect(save.id).toEqual('12345');
    expect(save.url).toEqual('http://domain.com');
  });
  it('throws NotFoundError if cannot find a SavedItem by url', async () => {
    expect.assertions(1);
    jest
      .spyOn(SavedItemDataService.prototype, 'getSavedItemByGivenUrl')
      .mockResolvedValue(null);
    try {
      await SavedItemRef.resolve({ url: 'http://domain.com' }, context);
    } catch (err) {
      expect(err.extensions.code).toEqual('NOT_FOUND');
    }
  });
  it('throws NotFoundError if cannot find a SavedItem by id', async () => {
    expect.assertions(1);
    jest
      .spyOn(SavedItemDataService.prototype, 'getSavedItemById')
      .mockResolvedValue(null);
    try {
      await SavedItemRef.resolve({ id: '12345' }, context);
    } catch (err) {
      expect(err.extensions.code).toEqual('NOT_FOUND');
    }
  });
});
