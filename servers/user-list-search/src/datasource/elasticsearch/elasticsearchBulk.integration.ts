import { expect } from 'chai';
import { config } from '../../config';
import { client } from './index';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';

import { bulkDocument } from './elasticsearchBulk';
import { getDocument } from './elasticsearchSearch';

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

//Set this here so the client instantiates outside of the before block that has a timeout.
const esClient = client;

chai.use(chaiAsPromised);

describe('Elasticsearch Bulk', () => {
  beforeAll(async () => {
    await esClient.deleteByQuery({
      index: config.aws.elasticsearch.index,
      type: config.aws.elasticsearch.type,
      body: {
        query: {
          match_all: {},
        },
      },
    });

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
  });

  it('can bulk index a document', async () => {
    const document = (await getDocument('1-12345')) as any;
    expect(document).to.not.be.null;
    expect(document._source.title).to.eq('A super fun article');
  }, 10000);

  it('can bulk delete a document', async () => {
    await bulkDocument([
      {
        action: 'delete',
        user_id: 1,
        item_id: 12345,
      },
    ]);
    expect(getDocument('1-12345')).eventually.to.be.rejectedWith('Not Found');
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

    expect(result.errors).to.be.false;
  }, 10000);
});
