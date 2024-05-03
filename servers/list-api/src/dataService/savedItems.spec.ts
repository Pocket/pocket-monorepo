import { SavedItemDataService } from './savedItemsService.js';

describe('SavedItemsDataService', () => {
  describe('convertDbResultStatus', () => {
    it('converts 0 to UNREAD', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 0 });
      expect(result.status).toBe('UNREAD');
    });
    it('converts 1 to ARCHIVED', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 1 });
      expect(result.status).toBe('ARCHIVED');
    });
    it('converts 2 to DELETED', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 2 });
      expect(result.status).toBe('DELETED');
    });
    it('converts 3 to HIDDEN', () => {
      const result = SavedItemDataService.convertDbResultStatus({ status: 3 });
      expect(result.status).toBe('HIDDEN');
    });
  });
});
