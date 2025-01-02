import { client } from '../datasource/elasticsearch';
import { config } from '../config';
import { bulkDocument } from '../datasource/elasticsearch/elasticsearchBulk';
import { deleteSearchIndexByUserId } from './elasticsearch';
import { deleteDocuments } from '../test/utils/searchIntegrationTestHelpers';

const defaultDocProps = {
  resolved_id: 1,
  url: '',
  excerpt: '',
  domain_id: 1,
  content_type: ['web'],
  word_count: 1,
  favorite: false,
  status: 'queued',
  lang: 'en',
};

describe('Elasticsearch - Integration', () => {
  beforeEach(async () => {
    await deleteDocuments();

    await bulkDocument([
      {
        ...defaultDocProps,
        action: 'index',
        item_id: 12345,
        url: 'https://test1.com',
        favorite: false,
        title: 'A super fun article',
        date_added: '2020-07-27T20:17:33.019Z',
        user_id: 1,
        tags: ['fun', 'super', 'common'],
        date_published: '2020-07-27T20:17:33.019Z',
        full_text: 'some text that can be used for article highlights',
        word_count: 10,
      },
      {
        ...defaultDocProps,
        action: 'index',
        item_id: 123,
        url: 'https://test2.com',
        favorite: true,
        title: 'Another fun article',
        date_added: '2021-06-27T20:17:33.019Z',
        user_id: 1,
        tags: ['fun', 'coffee'],
        status: 'queued',
        date_published: '2020-06-27T20:17:33.019Z',
        full_text: 'some text that can be used for article highlights',
        word_count: 50,
      },
      {
        ...defaultDocProps,
        action: 'index',
        item_id: 456,
        url: 'https://test3.com',
        favorite: true,
        title: 'snowboarding fun article',
        date_added: '2021-05-27T20:17:33.019Z',
        user_id: 1,
        status: 'archived',
        tags: ['snow', 'snowboard', 'article'],
        date_published: '2021-05-27T20:17:33.019Z',
        full_text: 'not related to search',
        word_count: 100,
      },
      {
        ...defaultDocProps,
        action: 'index',
        item_id: 789,
        url: 'https://winter.com',
        favorite: true,
        title: 'winter skating fun article',
        date_added: '2020-10-27T20:17:33.019Z',
        user_id: 2,
        tags: ['fun', 'skating'],
        status: 'queued',
        content_type: ['video'],
        date_published: '2020-10-27T20:17:33.019Z',
        full_text: 'winter sports article',
        word_count: 500,
      },
    ]);

    // Wait for index to finish
    await client.indices.refresh({
      index: config.aws.elasticsearch.list.index,
    });
  });

  it('deletes all documents for a given user_id', async () => {
    const search = (userId: string) =>
      client.search({
        index: config.aws.elasticsearch.list.index,
        routing: userId,
        body: {
          query: {
            match: {
              user_id: userId,
            },
          },
        },
      });

    const baseRes = await search('1');
    expect(baseRes.hits.total['value']).toBe(3);

    await deleteSearchIndexByUserId('1', true);

    // Wait for delete to finish
    await client.indices.refresh({
      index: config.aws.elasticsearch.list.index,
    });

    const resUser1 = await search('1');
    const resUser2 = await search('2');

    expect(resUser1.hits.total['value']).toBe(0);
    expect(resUser2.hits.total['value']).toBe(1);
  });
});
