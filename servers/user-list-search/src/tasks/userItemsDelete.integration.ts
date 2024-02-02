import { processMessages } from './userItemsDelete';
import { sendMessage, purgeQueue } from '../sqs';
import { config } from '../config';
import { getDocument } from '../datasource/elasticsearch/elasticsearchSearch';
import { IndexDocument } from '../elasticsearch';
import { bulkDocument } from '../datasource/elasticsearch/elasticsearchBulk';
import { client } from '../datasource/elasticsearch';

const defaultDoc = {
  action: 'index',
  title: 'A super fun article',
  date_added: '2020-07-27T20:17:33.019Z',
  tags: ['fun', 'super', 'common'],
  date_published: '2020-07-27T20:17:33.019Z',
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

const testItems = [
  {
    userId: 1,
    itemIds: [1, 2, 3, 4, 5],
  },
  {
    userId: 2,
    itemIds: [6, 7, 8, 9, 10],
  },
];

const getTestIndexDocuments = (): IndexDocument[] => {
  const indexItems = [];
  testItems.forEach((userItem) => {
    indexItems.push(
      ...userItem.itemIds.map((itemId): IndexDocument => {
        return {
          ...defaultDoc,
          action: 'index',
          user_id: userItem.userId,
          item_id: itemId,
        };
      })
    );
  });

  return indexItems;
};

//Set this here so the client instantiates outside of the before block that has a timeout.
const esClient = client;

describe('userItemsDelete', () => {
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
    // Wait for delete to finish
    await esClient.indices.refresh({ index: config.aws.elasticsearch.index });
  });

  it('processes item delete queue', async () => {
    await Promise.all([purgeQueue(config.aws.sqs.userItemsDeleteUrl)]);

    await bulkDocument(getTestIndexDocuments());

    //Populate the queue with users and item ids to delete
    await sendMessage(config.aws.sqs.userItemsDeleteUrl, {
      userItems: testItems,
    });

    //Let the user item delete processor process the queue
    await processMessages();
    //Ensure each document we just passed along was deleted for user 1
    for (let i = 1; i <= 5; i++) {
      expect(getDocument(`1-${i}`)).rejects.toThrow();
    }

    //Ensure each document we just passed alone was deleted for user 2
    for (let i = 6; i <= 10; i++) {
      expect(getDocument(`2-${i}`)).rejects.toThrow();
    }
  }, 30000);
});
