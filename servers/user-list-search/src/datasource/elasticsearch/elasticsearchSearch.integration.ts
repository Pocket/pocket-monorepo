import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { search, searchSavedItems } from './elasticsearchSearch';
import { bulkDocument } from './elasticsearchBulk';
import {
  SavedItemContentType,
  SearchFilterStatus,
  SearchItemsSortBy,
  SortDirection,
} from '../../types';
import { client } from './index';
import { config } from '../../config';

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

chai.use(chaiAsPromised);

describe('Elasticsearch Search Query', () => {
  beforeEach(async () => {
    await client.deleteByQuery({
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
        ...defaultDocProps,
        action: 'index',
        item_id: 12345,
        url: 'http://test1.com',
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
        url: 'http://test2.com',
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
        url: 'http://test3.com',
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
        url: 'http://winter.com',
        favorite: true,
        title: 'winter skating fun article',
        date_added: '2020-10-27T20:17:33.019Z',
        user_id: 1,
        tags: ['fun', 'skating'],
        status: 'queued',
        content_type: ['video'],
        date_published: '2020-10-27T20:17:33.019Z',
        full_text: 'winter sports article',
        word_count: 500,
      },
      {
        ...defaultDocProps,
        action: 'index',
        item_id: 777,
        url: 'http://vienna-review.net',
        favorite: false,
        title: 'Review of Rudolf: Affaire Mayerling',
        date_added: '2020-10-27T20:17:33.019Z',
        user_id: 1,
        tags: ['broadway'],
        status: 'queued',
        content_type: ['video'],
        date_published: '2020-10-27T20:17:33.019Z',
        full_text: `Drew Sarich steals the stage in the musical retelling of Rudolf and Mary's tragic love affair`,
        word_count: 500,
      },
      {
        ...defaultDocProps,
        action: 'index',
        item_id: 333,
        url: 'http://music-mender.com',
        favorite: true,
        title: 'Ten tips for writing great music',
        date_added: '2020-10-27T20:17:33.019Z',
        user_id: 1,
        tags: ['music'],
        status: 'queued',
        content_type: ['video'],
        date_published: '2020-10-27T20:17:33.019Z',
        full_text:
          'Having a relative in the music biz is the best way to get your music popular.',
        word_count: 500,
      },
    ]);

    // wait for 1 second. I noticed test wasn't passing if run took quickly after inserting. There may be more to do
    // here to make sure this does not become brittle.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  // For now this gives us confidence that basic search is not
  // broken when we make updates
  it('can search for a document', async () => {
    const document = await search({
      filters: { userId: '1' },
      term: 'A super fun article',
      fields: ['title'],
    });
    expect(document.results).to.not.be.null;
    expect(document.results[0].itemId).to.equal(12345);
  }, 10000);
  it('handles query strings with reserved characters', async () => {
    const response = await searchSavedItems(
      {
        term: 'http://test3.com',
      },
      '1'
    );
    // Default sort order is relevance; url should be on top and should be in highlight field
    expect(response.edges).to.not.be.null;
    expect(response.edges.length).to.be.greaterThanOrEqual(1);
    expect(response.edges[0].node.searchHighlights.url.length).to.equal(1);
    expect(response.edges[0].node.searchHighlights.url[0]).to.contain('test3');
  });

  it('should return only search items matching with filters', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun article',
        filter: {
          isFavorite: true,
          status: SearchFilterStatus.UNREAD,
          contentType: SavedItemContentType.VIDEO,
        },
        sort: null,
        pagination: { first: 10 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(1);
    expect(response.pageInfo.hasNextPage).is.false;
    expect(response.pageInfo.hasPreviousPage).is.false;
    expect(response.edges.length).equals(1);
    expect(response.edges[0].node.savedItem.id).equals(789);
    expect(response.edges[0].node.searchHighlights['fullText']).deep.equals([
      `winter sports <em>article</em>`,
    ]);
    expect(response.edges[0].node.searchHighlights['tags']).deep.equals([
      `<em>fun</em>`,
    ]);
  }, 10000);

  it('should sort search result on date_added in descending order  ', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun article',
        sort: {
          sortBy: SearchItemsSortBy.CREATED_AT,
          sortOrder: SortDirection.DESC,
        },
        pagination: { first: 2 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(4);
    expect(response.pageInfo.hasNextPage).is.true;
    expect(response.pageInfo.hasPreviousPage).is.not.true;
    expect(response.edges.length).equals(2);
    expect(response.edges[0].node.savedItem.id).equals(123);
    expect(response.edges[1].node.savedItem.id).equals(456);
  }, 10000);

  it('should sort search result on date_added in ascending order  ', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun article',
        sort: {
          sortBy: SearchItemsSortBy.CREATED_AT,
          sortOrder: SortDirection.ASC,
        },
        pagination: { first: 2 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(4);
    expect(response.pageInfo.hasNextPage).is.true;
    expect(response.pageInfo.hasPreviousPage).is.not.true;
    expect(response.edges.length).equals(2);
    expect(response.edges[0].node.savedItem.id).equals(12345);
    expect(response.edges[1].node.savedItem.id).equals(789);
  }, 10000);

  it('should sort by time_to_read in ascending order ', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun article',
        sort: {
          sortBy: SearchItemsSortBy.TIME_TO_READ,
        },
        pagination: { first: 2 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(4);
    expect(response.pageInfo.hasNextPage).is.true;
    expect(response.pageInfo.hasPreviousPage).is.not.true;
    expect(response.edges.length).equals(2);
    expect(response.edges[0].cursor).equal('MA==');
    expect(response.edges[0].node.savedItem.id).equals(12345);
    expect(response.edges[1].node.savedItem.id).equals(123);
  }, 10000);

  it('should sort by time_to_read in descending order ', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun article',
        sort: {
          sortBy: SearchItemsSortBy.TIME_TO_READ,
          sortOrder: SortDirection.DESC,
        },
        pagination: { first: 2 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(4);
    expect(response.pageInfo.hasNextPage).is.true;
    expect(response.pageInfo.hasPreviousPage).is.not.true;
    expect(response.edges.length).equals(2);
    expect(response.edges[0].cursor).equal('MA==');
    expect(response.edges[0].node.savedItem.id).equals(789);
    expect(response.edges[1].node.savedItem.id).equals(456);
  }, 10000);

  it('should sort by relevance in descending order ', async () => {
    const response = await searchSavedItems(
      {
        term: 'music',
        sort: {
          sortBy: SearchItemsSortBy.RELEVANCE,
          sortOrder: SortDirection.DESC,
        },
        pagination: { first: 2 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(2);
    expect(response.edges.length).equals(2);
    expect(response.edges[0].node.savedItem.id).equals(333);
    expect(response.edges[1].node.savedItem.id).equals(777);
  }, 10000);

  it('should sort by relevance in ascending order ', async () => {
    // To cover our bases, I guess... although why would you sort like this
    const response = await searchSavedItems(
      {
        term: 'music',
        sort: {
          sortBy: SearchItemsSortBy.RELEVANCE,
          sortOrder: SortDirection.ASC,
        },
        pagination: { first: 2 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(2);
    expect(response.edges.length).equals(2);
    expect(response.edges[0].node.savedItem.id).equals(777);
    expect(response.edges[1].node.savedItem.id).equals(333);
  }, 10000);

  it('should return search response with paginated fields first', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun article',
        pagination: { first: 2 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(4);
    expect(response.pageInfo.hasNextPage).is.true;
    expect(response.pageInfo.hasPreviousPage).is.false;
    expect(response.edges.length).equals(2);
    expect(response.edges[0].cursor).equals('MA==');
    expect(response.edges[0].node.savedItem.id).equals(456);
    expect(response.edges[0].node.searchHighlights['fullText']).is.null;
    expect(response.edges[0].node.searchHighlights['tags']).deep.equals([
      `<em>article</em>`,
    ]);
    expect(response.edges[0].node.searchHighlights['title']).deep.equals([
      `snowboarding <em>fun</em> <em>article</em>`,
    ]);
    expect(response.edges[1].cursor).equals('MQ==');
    expect(response.edges[1].node.savedItem.id).equals(123);
    expect(response.edges[1].node.searchHighlights['fullText']).deep.equals([
      `some text that can be used for <em>article</em> highlights`,
    ]);
    expect(response.edges[1].node.searchHighlights['tags']).deep.equals([
      `<em>fun</em>`,
    ]);
    expect(response.edges[1].node.searchHighlights['title']).deep.equals([
      `Another <em>fun</em> <em>article</em>`,
    ]);
  }, 10000);

  it('should return paginated items with before and last set ', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun',
        pagination: { before: 'Mw==', last: 4 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(4);
    expect(response.pageInfo.hasNextPage).is.true;
    expect(response.pageInfo.hasPreviousPage).is.false;
    expect(response.pageInfo.startCursor).equals('MA==');
    expect(response.pageInfo.endCursor).equals('Mg==');
    expect(response.edges.length).equals(3);
    expect(response.edges[0].cursor).equal('MA==');
    expect(response.edges[2].cursor).equal('Mg==');
    expect(response.edges[0].node.savedItem.id).equals(123);
    expect(response.edges[1].node.savedItem.id).equals(789);
  }, 10000);

  it('should return paginated items with after and first set ', async () => {
    const response = await searchSavedItems(
      {
        term: 'fun',
        pagination: { after: 'MA==', first: 10 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(4);
    expect(response.pageInfo.hasNextPage).is.false;
    expect(response.pageInfo.hasPreviousPage).is.true;
    expect(response.pageInfo.startCursor).equals('MQ==');
    expect(response.pageInfo.endCursor).equals('Mw==');
    expect(response.edges.length).equals(3);
    expect(response.edges[0].cursor).equal('MQ==');
    expect(response.edges[2].cursor).equal('Mw==');
    expect(response.edges[0].node.savedItem.id).equals(789);
    expect(response.edges[1].node.savedItem.id).equals(456);
    expect(response.edges[2].node.savedItem.id).equals(12345);
  }, 10000);

  it('should return total count with 0 if text doesnt match ', async () => {
    const response = await searchSavedItems(
      {
        term: 'panda',
        pagination: { before: 'Mw==', last: 4 },
      },
      `1`
    );
    expect(response).to.not.be.null;
    expect(response.totalCount).equals(0);
    expect(response.pageInfo.hasNextPage).is.false;
    expect(response.pageInfo.hasPreviousPage).is.false;
    expect(response.pageInfo.startCursor).is.null;
    expect(response.pageInfo.endCursor).is.null;
    expect(response.edges.length).equals(0);
  }, 10000);
});
