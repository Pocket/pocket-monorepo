import { config } from '../../config';
import { client } from './index';

import { bulkDocument } from './elasticsearchBulk';
import { getDocument } from './elasticsearchSearch';
import { deleteDocuments } from '../../test/utils/searchIntegrationTestHelpers';

const defaultDocProps = {
  resolved_id: 1,
  url: '',
  full_text: '',
  excerpt: '',
  domain_id: 1,
  content_type: ['web'],
  word_count: 1,
  favorite: false,
  status: 'queued',
  lang: 'en',
};

describe('Elasticsearch Bulk', () => {
  beforeAll(async () => {
    await deleteDocuments();

    await bulkDocument([
      {
        action: 'index',
        item_id: 12345,
        title: 'A super fun article',
        date_added: '2020-07-27T20:17:33.019Z',
        user_id: 1,
        tags: ['fun', 'super', 'common'],
        date_published: '2020-07-27T20:17:33.019Z',
        ...defaultDocProps,
      },
    ]);
    // Wait for index to finish
    await client.indices.refresh({
      index: config.aws.elasticsearch.list.index,
    });
  });

  afterAll(async () => {
    await deleteDocuments();
  });

  it('can bulk index a document', async () => {
    const document = (await getDocument('1-12345')) as any;
    expect(document).not.toBeNull();
    expect(document._source.title).toBe('A super fun article');
  }, 10000);

  it('can bulk delete a document', async () => {
    await bulkDocument([
      {
        action: 'delete',
        user_id: 1,
        item_id: 12345,
      },
    ]);
    expect(getDocument('1-12345')).rejects.toThrow();
  }, 10000);

  it('will ignore a document not existing', async () => {
    const [result] = await bulkDocument([
      {
        action: 'delete',
        user_id: 1,
        item_id: 12345,
      },
      {
        action: 'delete',
        user_id: 67,
        item_id: 56789,
      },
    ]);

    expect(result.errors).toBeFalse();
  }, 10000);
});
