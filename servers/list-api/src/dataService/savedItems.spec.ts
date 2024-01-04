import { SavedItemDataService } from './savedItemsService';
import { expect } from 'chai';

describe('SavedItemsDataService', () => {
  describe('convertDbResultStatus', () => {
    it('converts 0 to UNREAD', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 0 });
      expect(result.status).to.equal('UNREAD');
    });
    it('converts 1 to ARCHIVED', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 1 });
      expect(result.status).to.equal('ARCHIVED');
    });
    it('converts 2 to DELETED', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 2 });
      expect(result.status).to.equal('DELETED');
    });
    it('converts 3 to HIDDEN', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 3 });
      expect(result.status).to.equal('HIDDEN');
    });
  });
});
