import { bulkIndex } from '.';
import { EventPayload } from './types';
import { config } from './config';
import * as cd from './createDoc';

/**
 * Test cleanup: delete all documents in corpus indices
 */
async function deleteDocuments() {
  for await (const index of Object.values(config.indexLangMap)) {
    await fetch(
      `${config.apiEndpoint}/${index}/_delete_by_query?wait_for_completion=true`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: { match_all: {} } }),
      },
    );
  }
}

/**
 * Retrieve a document from elasticsearch by index and document ID
 */
async function getDocById(index: string, id: string) {
  const res = await fetch(`${config.apiEndpoint}/${index}/_doc/${id}`, {
    method: 'get',
  });
  return await res.json();
}

describe('bulk indexer', () => {
  afterEach(async () => {
    await deleteDocuments();
  });
  beforeAll(async () => {
    jest.restoreAllMocks();
    await deleteDocuments();
  });
  it('successfully indexes a single corpus item', async () => {
    const payloads: EventPayload[] = [
      {
        messageId: '123abc',
        detailType: 'add-approved-item',
        detail: {
          eventType: 'add-approved-item',
          url: 'http://some-url.com',
          approvedItemExternalId: 'aaaaa',
          language: 'en',
        },
      },
    ];
    const result = await bulkIndex(payloads);
    expect(result.batchItemFailures).toEqual([]);
    const roundtrip = await getDocById('corpus_en', 'aaaaa');
    expect(roundtrip._source).toMatchObject({
      url: 'http://some-url.com',
      language: 'en',
      found: true,
    });
  });
  it('successfully indexes a batch of corpus items', async () => {
    const payloads: EventPayload[] = [
      {
        messageId: '123abc',
        detailType: 'add-approved-item',
        detail: {
          eventType: 'add-approved-item',
          url: 'http://some-url.com',
          approvedItemExternalId: 'bbbbbbb',
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
          language: 'de',
        },
      },
      // Collection
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
            stories: [
              {
                collection_story_id: '888jsn',
                url: 'http://der-vogel.de',
                title: 'die krähen fliegen heute',
                excerpt: '',
                authors: [{ name: 'anonym anonym', sort_order: 1 }],
                is_from_partner: false,
              },
              {
                collection_story_id: '777yeet',
                url: 'http://manderley.de',
                title: 'wir wilkommen die neue mrs. de winter ins manderley',
                excerpt: '',
                authors: [{ name: 'anonym anonym', sort_order: 1 }],
                is_from_partner: false,
              },
            ],
          },
        },
      },
    ];
    const result = await bulkIndex(payloads);
    expect(result.batchItemFailures).toEqual([]);
    const docs = await Promise.all([
      getDocById('corpus_en', 'bbbbbbb'),
      getDocById('corpus_de', 'ccccccc'),
      getDocById('corpus_de', '999rsk'),
      getDocById('corpus_de', '888jsn'),
      getDocById('corpus_de', '777yeet'),
    ]);
    expect(docs).toEqual([
      expect.objectContaining({ _id: 'bbbbbbb', found: true }),
      expect.objectContaining({ _id: 'ccccccc', found: true }),
      expect.objectContaining({ _id: '999rsk', found: true }),
      expect.objectContaining({ _id: '888jsn', found: true }),
      expect.objectContaining({ _id: '777yeet', found: true }),
    ]);
    // Check the collections in particular
    const collection = docs[2];
    expect(collection._source).toMatchObject({
      title: 'ein titel',
      is_collection_story: false,
      is_collection: true,
    });
    const stories = docs.slice(3).map((_) => _._source);
    expect(stories).toEqual([
      expect.objectContaining({
        url: 'http://der-vogel.de',
        title: 'die krähen fliegen heute',
        is_collection_story: true,
        parent_collection_id: '999rsk',
      }),
      expect.objectContaining({
        url: 'http://manderley.de',
        title: 'wir wilkommen die neue mrs. de winter ins manderley',
        is_collection_story: true,
        parent_collection_id: '999rsk',
      }),
    ]);
  });
  it('removes invalid languages', async () => {
    const payloads: EventPayload[] = [
      {
        messageId: '123abc',
        detailType: 'add-approved-item',
        detail: {
          eventType: 'add-approved-item',
          url: 'http://some-url.com',
          approvedItemExternalId: 'dddddd',
          language: 'not-language-code',
        },
      },
      {
        messageId: '456def',
        detailType: 'add-approved-item',
        detail: {
          eventType: 'add-approved-item',
          url: 'http://eine-url.de',
          approvedItemExternalId: 'eeeee',
          language: 'de',
        },
      },
    ];
    const result = await bulkIndex(payloads);
    expect(result.batchItemFailures).toEqual([{ itemIdentifier: '123abc' }]);
    const doc = await getDocById('corpus_de', 'eeeee');
    expect(doc).toMatchObject({ _id: 'eeeee', found: true });
  });
  describe('with errors', () => {
    beforeAll(() =>
      jest.spyOn(cd, 'createDoc').mockImplementation(() => [
        {
          meta: { _id: 'abc123', _index: 'corpus_en' },
          fields: { url: 'http://something.com', _id: 'badfield' } as any,
        },
        {
          meta: { _id: 'def192', _index: 'corpus_en' },
          fields: { url: 'http://another-thing.com' } as any,
        },
      ]),
    );
    afterAll(() => jest.restoreAllMocks());
    it('handles partial success', async () => {
      const payloads: EventPayload[] = [
        {
          messageId: '123abc',
          detailType: 'add-approved-item',
          detail: {
            // Doesn't matter, overwritten by mock
            eventType: 'add-approved-item',
            url: 'http://some-url.com',
            approvedItemExternalId: 'aaaaa',
            language: 'en',
          },
        },
      ];
      const result = await bulkIndex(payloads);
      expect(result).toEqual({
        batchItemFailures: [{ itemIdentifier: '123abc' }],
      });
      const roundtrip = await getDocById('corpus_en', 'def192');
      expect(roundtrip).toMatchObject({
        _id: 'def192',
        found: true,
      });
    });
  });
});
