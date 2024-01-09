import { ListResult } from '../dataService/index';
import { PocketSaveModel } from './index';
import { PocketSave } from '../types';

const dateAdded = new Date('2008-10-21 13:57:01');
const dateFavorited = null;
const dateRead = new Date('2008-10-21 14:00:01');
const dateUpdated = new Date('2012-08-13 15:32:05');

describe('PocketSaveModel', () => {
  describe('transformListRow', () => {
    it('transform takes ListResult & Returns PocketSave', () => {
      const input: ListResult = {
        api_id: '1',
        api_id_updated: 1,
        favorite: 0,
        given_url: 'https://puppies.com',
        item_id: 1,
        resolved_id: 1,
        status: 'UNREAD',
        time_added: dateAdded,
        time_favorited: dateFavorited,
        time_read: dateRead,
        time_updated: dateUpdated,
        title: 'puppies',
        user_id: 1,
      };
      const output = PocketSaveModel.transformListRow(input);
      const expected: PocketSave = {
        __typename: 'PocketSave',
        archived: false,
        archivedAt: null,
        createdAt: new Date('2008-10-21 13:57:01'),
        deletedAt: null,
        favorite: false,
        favoritedAt: null,
        givenUrl: 'https://puppies.com',
        id: '1',
        status: 'UNREAD',
        title: 'puppies',
        updatedAt: new Date('2012-08-13 15:32:05'),
        resolvedId: '1',
      };
      expect(output).toStrictEqual(expected);
    });
  });
  describe('transformListRow', () => {
    it('transform handles status-driven dates', () => {
      const input: ListResult = {
        api_id: '1',
        api_id_updated: 1,
        favorite: 1,
        given_url: 'https://puppies.com',
        item_id: 1,
        resolved_id: 1,
        status: 'ARCHIVED',
        time_added: dateAdded,
        time_favorited: dateFavorited,
        time_read: dateRead,
        time_updated: dateUpdated,
        title: 'puppies',
        user_id: 1,
      };
      const output = PocketSaveModel.transformListRow(input);
      const expected: PocketSave = {
        __typename: 'PocketSave',
        archived: true,
        archivedAt: dateRead,
        createdAt: dateAdded,
        deletedAt: null,
        favorite: true,
        favoritedAt: null,
        givenUrl: 'https://puppies.com',
        id: '1',
        status: 'ARCHIVED',
        title: 'puppies',
        updatedAt: dateUpdated,
        resolvedId: '1',
      };
      expect(output).toStrictEqual(expected);
    });
  });
});
