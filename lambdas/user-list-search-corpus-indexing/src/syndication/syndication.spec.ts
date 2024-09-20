import { syndicationDupes } from './syndicationDupes';
import * as q from './originalCorpusId';
import { ValidatedEventPayload } from '../types';

describe('Syndicated article methods', () => {
  describe('syndicationDupes', () => {
    let originalCorpusIdMock;
    beforeAll(() => {
      originalCorpusIdMock = jest
        .spyOn(q, 'originalCorpusId')
        .mockResolvedValue(undefined)
        .mockResolvedValueOnce('abc-123')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce('def-ijk');
    });
    afterAll(() => {
      originalCorpusIdMock.mockRestore();
    });
    it('retrieves valid corpus ids for syndicated articles in payload', async () => {
      const payloads: ValidatedEventPayload[] = [
        {
          messageId: '123abc',
          detailType: 'add-approved-item',
          detail: {
            eventType: 'add-approved-item',
            url: 'http://some-url.com',
            approvedItemExternalId: 'bbbbbbb',
            isSyndicated: true,
            language: 'en',
          },
        },
        {
          messageId: '456def',
          detailType: 'add-approved-item',
          detail: {
            eventType: 'add-approved-item',
            url: 'http://eine-url.de',
            approvedItemExternalId: 'ccccccc',
            isSyndicated: false,
            language: 'de',
          },
        },
        {
          messageId: '456def',
          detailType: 'add-collection',
          detail: {
            collection: {
              externalId: '999rsk',
              slug: 'eine-addresse',
              title: 'ein titel',
              status: 'hochgeladen',
              language: 'de',
              createdAt: 123456,
              updatedAt: 123456,
              authors: [
                {
                  name: 'anonym anonym',
                  active: true,
                  collection_author_id: 'authorid',
                },
              ],
              stories: [],
            },
          },
        },
        {
          messageId: '237834kfj',
          detailType: 'add-approved-item',
          detail: {
            eventType: 'add-approved-item',
            url: 'http://another-url.com',
            approvedItemExternalId: 'bbbbbbb',
            isSyndicated: true,
            language: 'en',
          },
        },
        {
          messageId: '8485wcoe',
          detailType: 'add-approved-item',
          detail: {
            eventType: 'add-approved-item',
            url: 'http://noch-mal-url.com',
            approvedItemExternalId: 'bbbbbbb',
            isSyndicated: true,
            language: 'de',
          },
        },
      ];
      const expected = [
        { id: 'abc-123', index: 'corpus_en_luc' },
        { id: 'def-ijk', index: 'corpus_de' },
      ];
      const result = await syndicationDupes(payloads);
      expect(result).toEqual(expected);
      // Not called unless isSyndicated is true
      expect(originalCorpusIdMock).toHaveBeenCalledTimes(3);
      expect(originalCorpusIdMock).not.toHaveBeenCalledWith(
        'http://eine-url.de',
      );
    });
  });
});
