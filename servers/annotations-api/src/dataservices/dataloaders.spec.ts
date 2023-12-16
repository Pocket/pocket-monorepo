import sinon from 'sinon';
import { NotesDataService } from '../dataservices/notes';
import { dynamoClient } from '../database/client';
import { createNotesLoader, orderAndMapNotes } from './dataloaders';
import { IContext } from '../context';

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
      notesStub = sinon
        .stub(NotesDataService.prototype, 'getMany')
        .resolves(mockNotesResponse);
      notesLoader = createNotesLoader(dynamo, {
        isPremium: true,
        notesService,
      } as IContext);
    });
    afterEach(() => {
      notesStub.restore();
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
      expect(notesStub.calledOnceWith(['hij', 'def', 'abc'])).toBe(true);
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
