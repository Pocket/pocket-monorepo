import { bulkDocument } from './datasource/elasticsearch/elasticsearchBulk';
import {
  BaseListItem,
  ListItemEnriched,
  listItemStatusToString,
  ParserItem,
} from './datasource/DataSourceInterface';
import { normalizeDate, normalizeFullText, normalizeUrl } from './shared/util';
import { chunk } from 'lodash';
import { captureMessage } from '@sentry/node';
import { DeleteDocumentByQueryResponse } from 'elasticsearch';
import { config } from './config';
import { client } from './datasource/elasticsearch';
import * as Sentry from '@sentry/node';

export const getId = (doc: BaseDocument): string =>
  `${doc.user_id}-${doc.item_id}`;

export type BaseDocument = {
  action: string;
  user_id: number;
  item_id: number;
};

export type DeleteDocument = BaseDocument & {
  action: 'delete';
};

export type IndexDocument = BaseDocument & {
  action: 'index';
  tags: string[];
  title: string;
  resolved_id: number;
  url: string;
  authors?: string[];
  full_text: string;
  excerpt: string;
  date_published: string;
  date_added: string;
  domain_id: number;
  content_type: string[];
  word_count: number;
  lang: string;
  favorite: boolean;
  status: string;
};

export const getContentType = (item: ParserItem): string[] => {
  const contentTypes = [];

  if (item.isArticle) {
    contentTypes.push('article', 'articles');
  }

  if (item.hasVideo) {
    contentTypes.push('video', 'videos');
  }

  if (item.hasImage) {
    contentTypes.push('image', 'images');
  }

  if (contentTypes.length > 0) {
    contentTypes.push('web');
  }

  return contentTypes;
};

/**
 * Transforms item data to structure required for index
 * @param listItem
 */
export const createDocument = (
  listItem: ListItemEnriched,
): IndexDocument | null => {
  const tags = listItem.tags ?? [];
  const item = listItem.item;

  if (!item) {
    Sentry.addBreadcrumb({
      message: 'elasticsearch document',
      data: {
        itemId: listItem.itemId,
        userId: listItem.userId,
      },
    });

    captureMessage('No item when creating elasticsearch document');
    return null;
  }

  const result: IndexDocument = {
    action: 'index',
    tags,
    user_id: listItem.userId,
    title: item.title,
    resolved_id: item.resolvedId,
    item_id: item.itemId,
    url: normalizeUrl(listItem.givenUrl),
    full_text: normalizeFullText(item.content),
    excerpt: normalizeFullText(item.excerpt),
    date_published: normalizeDate(item.publishedAt),
    date_added: normalizeDate(listItem.createdAt),
    domain_id: item.domainId,
    content_type: getContentType(item),
    word_count: item.wordCount,
    lang: item.lang,
    favorite: listItem.favorite,
    status: listItemStatusToString(listItem.status),
  };

  if (item.authors) {
    result.authors = item.authors;
  }

  return result;
};

/**
 * Process a list item by adding it to elasticsearch index
 * @param listItems
 */
export const indexInElasticSearch = async (
  listItems: ListItemEnriched[],
): Promise<any> => {
  const chunkedListItems = chunk(listItems, 100);
  await Promise.all(
    chunkedListItems
      .map(async (listItems) => {
        const body: IndexDocument[] = listItems
          .map(createDocument)
          .filter((doc: IndexDocument | null) => doc !== null);

        if (body.length) return bulkDocument(body);
      })
      .filter((bulkRequest) => !!bulkRequest),
  );
};

/**
 * Delete a list item from the elasticsearch index
 * @param listItems
 */
export const deleteFromElasticSearch = async (
  listItems: BaseListItem[],
): Promise<any> => {
  const chunkedListItems = chunk(listItems, 100);
  await Promise.all(
    chunkedListItems.map(async (listItems) => {
      const body: DeleteDocument[] = listItems.map((listItem) => {
        return {
          action: 'delete',
          user_id: listItem.userId,
          item_id: listItem.itemId,
        } as DeleteDocument;
      });

      return bulkDocument(body);
    }),
  );
};

/**
 * Deletes all documents in Elasticsearch for a given user_id
 * @param userId
 * @param waitForCompletion
 */
export async function deleteSearchIndexByUserId(
  userId: string,
  waitForCompletion = false,
): Promise<DeleteDocumentByQueryResponse | void> {
  const { list, maxRetries } = config.aws.elasticsearch;
  const { index, deleteConfig } = list;
  return client.deleteByQuery({
    index,
    maxRetries,
    // Run async - https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete-by-query.html#docs-delete-by-query-task-api
    waitForCompletion,
    routing: userId,
    // Increase delete performance https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-delete-by-query.html#docs-delete-by-query-slice
    slices: deleteConfig.slices,
    body: {
      query: {
        match: {
          user_id: userId,
        },
      },
    },
  });
}
