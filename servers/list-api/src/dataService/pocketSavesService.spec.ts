import { PocketSaveDataService } from './pocketSavesService.js';
import { RawListResult } from './types.js';
const dateAdded = new Date('2008-10-21 13:57:01');
const dateFavorited = new Date('0000-00-00 00:00:00');
const dateRead = new Date('2008-10-21 14:00:01');
const dateUpdated = new Date('2012-08-13 15:32:05');

const rawListResult: RawListResult = {
  api_id: '123',
  api_id_updated: 0,
  favorite: 0,
  given_url: 'http://www.ideashower.com/',
  item_id: 5,
  resolved_id: 5,
  status: 0,
  time_added: dateAdded,
  time_favorited: dateFavorited,
  time_read: dateRead,
  time_updated: dateUpdated,
  title: 'the Idea Shower',
  user_id: 1,
};

describe('PocketSaveDataService', () => {
  describe('convertListResult', () => {
    it('converts 0 to UNREAD', () => {
      const result = PocketSaveDataService.convertListResult(rawListResult);
      expect(result.status).toStrictEqual('UNREAD');
    });
    it('converts 1 to ARCHIVED', () => {
      rawListResult.status = 1;
      const result = PocketSaveDataService.convertListResult(rawListResult);
      expect(result.status).toStrictEqual('ARCHIVED');
    });
    it('converts 2 to DELETED', () => {
      rawListResult.status = 2;
      const result = PocketSaveDataService.convertListResult(rawListResult);
      expect(result.status).toStrictEqual('DELETED');
    });
    it('converts 3 to HIDDEN', () => {
      rawListResult.status = 3;
      const result = PocketSaveDataService.convertListResult(rawListResult);
      expect(result.status).toStrictEqual('HIDDEN');
    });
    it('null in null out', () => {
      const result = PocketSaveDataService.convertListResult(null);
      expect(result).toStrictEqual(null);
    });
    it('handles stupid "0000-00-00 00:00:00" dates', () => {
      const result = PocketSaveDataService.convertListResult(rawListResult);
      expect(result.time_favorited).toStrictEqual(null);
    });
    it('handles good non-0 dates', () => {
      const result = PocketSaveDataService.convertListResult(rawListResult);
      expect(result.time_added).toStrictEqual(dateAdded);
    });
  });
});
