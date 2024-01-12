import sinon from 'sinon';
import {
  AccountDeleteDataService,
  TablePrimaryKeyModel,
} from './accountDeleteDataService';
import { writeClient } from './clients';
import { expect } from 'chai';

describe('batchDeleteUserInformation', () => {
  const dataService = new AccountDeleteDataService(1, writeClient());

  beforeEach(() => {
    sinon.restore();
  });

  it('should primary keys passed', async () => {
    const deleteByKeysStub = sinon
      .stub(dataService, 'deleteByKeys')
      .resolves(3);
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
    expect(deleteByKeysStub.callCount).equals(1);
  });

  it('check args passed to deleteKeys', async () => {
    const table = 'test_tables';
    const args: TablePrimaryKeyModel = {
      primaryKeyNames: ['a', 'b'],
      primaryKeyValues: [[1, 2]],
    };
    const deleteByKeysStub = sinon
      .stub(dataService, 'deleteByKeys')
      .withArgs(table, args);
    await dataService.batchDeleteUserInformation(table, args, '1', []);
    expect(deleteByKeysStub.callCount).equals(1);
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
    const deleteByKeysStub = sinon
      .stub(dataService, 'deleteByKeys')
      .resolves(3);
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
    expect(deleteByKeysStub.callCount).equals(3);
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
    const deleteByKeysStub = sinon
      .stub(dataService, 'deleteByKeys')
      .resolves(3);
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
    expect(deleteByKeysStub.callCount).equals(1);
  });
});
