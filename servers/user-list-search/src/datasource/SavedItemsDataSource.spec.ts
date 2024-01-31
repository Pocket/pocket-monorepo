import { SavedItemDataService } from './SavedItemsDataSource';
import { config } from '../config';

describe('spec test to make sure validatePagination works as expected for user-list-search', () => {
  it('validate pagination should return first 30 when pagination is null', () => {
    const pagination = SavedItemDataService.validatePagination(null);
    expect(pagination).toEqual({ first: config.pagination.defaultPageSize });
  });

  it('when first is over max page size ', () => {
    const pagination = SavedItemDataService.validatePagination({ first: 140 });
    expect(pagination).toEqual({ first: config.pagination.maxPageSize });
  });

  it('when last is over max page size ', () => {
    const pagination = SavedItemDataService.validatePagination({ last: 140 });
    expect(pagination).toEqual({ last: config.pagination.maxPageSize });
  });
});
