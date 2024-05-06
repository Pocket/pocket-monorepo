import { NotesDataService } from '../dataservices/notes.js';
import { dynamoClient } from '../database/client.js';
import { createNotesLoader, orderAndMapNotes } from './dataloaders.js';
import { IContext } from '../context.js';
import { jest } from '@jest/globals';

describe('dataloaders', () => {
  const mockNotesResponse = [
    { highlightId: 'abc', text: 'bread', _createdAt: 1, _updatedAt: 1 },
    { highlightId: 'def', text: 'garlic', _createdAt: 1, _updatedAt: 1 },
    { highlightId: 'hij', text: 'yummy', _createdAt: 1, _updatedAt: 1 },
  ];
  describe('orderAndMapNotes utility function', () => {
    it('reorders data by highlightId', () => {
      const result = orderAndMapNotes(
        ['hij', 'def', 'abc', 'hij'],
        mockNotesResponse,
      );
      const expected = [
        { highlightId: 'hij', text: 'yummy', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'def', text: 'garlic', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'abc', text: 'bread', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'hij', text: 'yummy', _createdAt: 1, _updatedAt: 1 },
      ];
      expect(result).toStrictEqual(expected);
    });
    it('returns undefined object if data is missing for key', () => {
      const result = orderAndMapNotes(['zzz', 'def', 'abc'], mockNotesResponse);
      const expected = [
        undefined,
        { highlightId: 'def', text: 'garlic', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'abc', text: 'bread', _createdAt: 1, _updatedAt: 1 },
      ];
      expect(result).toStrictEqual(expected);
    });
  });
  describe('loading HighlightNotes', () => {
    let notesStub;
    let notesLoader;
    // This is required for NotesDataServiceconstructor,
    // but fetch is never invoked because we mock the data retrieval function
    const dynamo = dynamoClient();
    beforeEach(() => {
      const notesService = new NotesDataService(dynamo, '1');
      notesStub = jest
        .spyOn(NotesDataService.prototype, 'getMany')
        .mockReturnValue(Promise.resolve(mockNotesResponse));
      notesLoader = createNotesLoader(dynamo, {
        isPremium: true,
        notesService,
      } as IContext);
    });
    afterEach(() => {
      notesStub.mockRestore();
    });
    it('reorders data by highlightId', async () => {
      const result = await notesLoader.loadMany(['hij', 'def', 'abc', 'hij']);
      const expected = [
        { highlightId: 'hij', text: 'yummy', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'def', text: 'garlic', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'abc', text: 'bread', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'hij', text: 'yummy', _createdAt: 1, _updatedAt: 1 }, // retrieved from cache
      ];
      expect(result).toStrictEqual(expected);
      // Should get subsequent duplicate keys from cache
      expect(notesStub).toHaveBeenCalledWith(['hij', 'def', 'abc']);
      expect(notesStub).toHaveBeenCalledTimes(1);
    });
    it('returns undefined object if data is missing for key', async () => {
      const result = await notesLoader.loadMany(['zzz', 'def', 'abc']);
      const expected = [
        undefined,
        { highlightId: 'def', text: 'garlic', _createdAt: 1, _updatedAt: 1 },
        { highlightId: 'abc', text: 'bread', _createdAt: 1, _updatedAt: 1 },
      ];
      expect(result).toStrictEqual(expected);
    });
  });
});
