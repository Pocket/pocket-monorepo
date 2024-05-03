import {
  AccountDeleteDataService,
  TablePrimaryKeyModel,
} from './accountDeleteDataService.js';
import { writeClient } from './clients.js';

describe('batchDeleteUserInformation', () => {
  const dataService = new AccountDeleteDataService(1, writeClient());

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should primary keys passed', async () => {
    const deleteByKeysStub = jest
      .spyOn(dataService, 'deleteByKeys')
      .mockResolvedValue(3);
    const inputModel: TablePrimaryKeyModel = {
      primaryKeyNames: ['a', 'b'],
      primaryKeyValues: [
        [1, 2],
        [3, 4],
        [5, 6],
      ],
    };
    await dataService.batchDeleteUserInformation(
      'test_table',
      inputModel,
      '1',
      [],
    );
    expect(deleteByKeysStub).toHaveBeenCalledTimes(1);
  });

  it('check args passed to deleteKeys', async () => {
    const table = 'test_tables';
    const args: TablePrimaryKeyModel = {
      primaryKeyNames: ['a', 'b'],
      primaryKeyValues: [[1, 2]],
    };
    const deleteByKeysStub = jest
      .spyOn(dataService, 'deleteByKeys')
      .mockImplementation((table, args) => {
        return Promise.resolve(1);
      });
    await dataService.batchDeleteUserInformation(table, args, '1', []);
    expect(deleteByKeysStub).toHaveBeenCalledTimes(1);
  });

  it('should break up too long lists', async () => {
    const inputModel: TablePrimaryKeyModel = {
      primaryKeyNames: ['a', 'b'],
      primaryKeyValues: [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
        [9, 10],
      ],
    };
    const deleteByKeysStub = jest
      .spyOn(dataService, 'deleteByKeys')
      .mockResolvedValue(3);
    const limitOverridesConfig = [
      {
        table: 'test_table_big',
        limit: 2,
      },
    ];
    await dataService.batchDeleteUserInformation(
      'test_table_big',
      inputModel,
      '1',
      limitOverridesConfig,
    );
    expect(deleteByKeysStub).toHaveBeenCalledTimes(3);
  });

  it('should not break up not overridden lists', async () => {
    const inputModel: TablePrimaryKeyModel = {
      primaryKeyNames: ['a', 'b'],
      primaryKeyValues: [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
        [9, 10],
      ],
    };
    const deleteByKeysStub = jest
      .spyOn(dataService, 'deleteByKeys')
      .mockResolvedValue(3);
    await dataService.batchDeleteUserInformation(
      'test_table_big',
      inputModel,
      '1',
      [
        {
          table: 'test_table_big_other',
          limit: 2,
        },
      ],
    );
    expect(deleteByKeysStub).toHaveBeenCalledTimes(1);
  });
});
