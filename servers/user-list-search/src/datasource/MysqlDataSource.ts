import {
  DataSourceInterface,
  ItemMap,
  ListItem,
  ParserItem,
} from './DataSourceInterface';
import { mysqlTimeStampToDate } from '../shared/util';
import {
  generateResolvedIdToItemIdMap,
  getItemIdFromResolvedId,
  ItemIdResolvedIdPair,
  ResolvedIdToItemIdHash,
} from '../shared/itemIdUtil';
import zlib from 'zlib';
import { contentDb, knexDbClient } from './clients/knexClient';
import knex from 'knex';

type ParserContent = {
  itemId: number;
  content: string;
};

type ContentItemMap = {
  [key: string]: ParserContent;
};

type ItemAuthor = {
  itemId: number;
  author: string;
};

let mysqlDb: MysqlDataSource;

export const legacyMysqlInterface = () => {
  if (mysqlDb) {
    return mysqlDb;
  }

  mysqlDb = new MysqlDataSource();
  return mysqlDb;
};

export class MysqlDataSource implements DataSourceInterface {
  readitla: knex.Knex<any, any[]>;
  content: knex.Knex<any, any[]>;

  constructor() {
    this.readitla = knexDbClient();
    this.content = contentDb();
  }

  /**
   * retrieves all the information we have about each given item
   *
   * @param itemIds
   */
  async getItems(itemIds: number[]): Promise<ItemMap> {
    // retrieve an array of objects containing an item id and corresponding resolved id
    // note - this may contain resolved ids of 0 because the parser can fail or just
    // take its sweet time finding a resolved id
    const itemIdsResolvedIds: ItemIdResolvedIdPair[] =
      await this.getItemIdResolvedIdPairs(itemIds);

    // convert the above array of objects into a single object where the resovled id is
    // the key and the item id is the value. filters out any resolved ids with a value of 0
    const resolvedIdsToItemIdsHash: ResolvedIdToItemIdHash =
      generateResolvedIdToItemIdMap(itemIdsResolvedIds);

    // retrieve all the extra information about the item
    const [items, itemContent, itemAuthors] = await Promise.all([
      // get title, excerpt, word count, url, etc
      this.getItemMeta(itemIds),
      // get the full text of the item
      this.getItemContent(resolvedIdsToItemIdsHash),
      // get any authors associated with the item
      this.getItemAuthors(resolvedIdsToItemIdsHash),
    ]);

    // inject the full text content into each item
    for (const [, parserContent] of Object.entries(itemContent)) {
      items[parserContent.itemId].content = parserContent.content;
    }

    // inject the authors into each item
    itemAuthors.forEach((pair) => {
      if (items[pair.itemId].authors) {
        items[pair.itemId].authors.push(pair.author);
      } else {
        items[pair.itemId].authors = [pair.author];
      }
    });

    return items;
  }

  /**
   * @inheritdoc
   * @param userId
   * @param itemIds
   */
  async getUserListItems(
    userId: number,
    itemIds: number[],
  ): Promise<ListItem[]> {
    const rows = await this.query(
      `SELECT
        l.item_id,
        l.status,
        l.given_url,
        l.favorite,
        l.time_added,
        it.tag
      FROM
        list l
      LEFT JOIN
        item_tags it ON (l.user_id = it.user_id AND l.item_id = it.item_id)
      WHERE
        l.user_id = ? AND l.item_id IN (?) AND l.status < 2`,
      [userId, itemIds],
    );

    const userItems = {};

    rows.forEach((row: any) => {
      const key = row.item_id;

      if (!userItems[key]) {
        userItems[key] = {
          itemId: row.item_id,
          status: row.status,
          favorite: !!parseInt(row.favorite),
          givenUrl: row.given_url,
          createdAt: mysqlTimeStampToDate(row.time_added),
          tags: [],
        } as ListItem;
      }

      userItems[key].tags.push(row.tag);
    });

    return Object.values(userItems);
  }

  /**
   * @inheritdoc
   * @param userId
   */
  async getUserItemIds(userId: number): Promise<number[]> {
    const sql = 'SELECT item_id FROM list WHERE user_id = ?';
    const rows = await this.query(sql, [userId]);

    return rows.map((item: any) => parseInt(item.item_id));
  }

  /**
   * @inheritdoc
   * @param userId
   */
  async isUserPremium(userId: number): Promise<boolean> {
    const sql = 'SELECT premium_status FROM users WHERE user_id = ?';
    const [row] = await this.query(sql, [userId]);

    return !!parseInt(row?.premium_status);
  }

  // TODO: Convert this to a stream.
  async getPremiumUserIds(): Promise<number[]> {
    // in prod this should be ~75k users...which we're assuming is fine to retrieve all in one go?
    const rows = await this.query(
      `SELECT
        u.user_id
      FROM
        users u
      LEFT JOIN
        user_recent_search srch on u.user_id=srch.user_id
      WHERE
        u.premium_status = 1
      GROUP BY
        u.user_id
      ORDER BY
        srch.time_added DESC`,
    );

    // mash the mysql rerturned rows into an array of numbers
    return rows.map((row) => {
      return row.user_id;
    });
  }

  async getPremiumUserIdsIn(userIds: number[]): Promise<number[]> {
    const sql =
      'SELECT user_id FROM users WHERE premium_status = 1 AND user_id in (?)';
    const [rows] = await this.query(sql, [userIds]);

    return rows.map((r) => r.user_id);
  }

  /**
   * Private function to get the items from mysql
   *
   * @param itemIds
   */
  private async getItemMeta(itemIds: number[]): Promise<ItemMap> {
    const rows = await this.query(
      `SELECT
        ir.item_id,
        ir.normal_url,
        ie.title,
        ie.excerpt,
        ie.extended_item_id AS resolved_id,
        ie.domain_id,
        ie.word_count AS wordCount,
        ie.image AS has_image,
        ie.video AS has_video,
        ie.is_article,
        ie.lang,
        ie.date_published
      FROM
        readitla_b.items_extended ie
      INNER JOIN
        readitla_b.items_resolver ir ON ir.resolved_id = ie.extended_item_id
      WHERE
        ir.item_id IN (?)`,
      [itemIds],
    );

    const items = {};

    rows.forEach((row: any) => {
      items[row.item_id] = {
        itemId: row.item_id,
        normalUrl: row.normal_url,
        title: row.title,
        excerpt: row.excerpt,
        resolvedId: row.resolved_id,
        domainId: row.domain_id,
        wordCount: row.wordCount,
        // TODO: has_image and has_video can have values of 2, what does this mean?
        hasImage: !!parseInt(row.has_image),
        hasVideo: !!parseInt(row.has_video),
        isArticle: !!parseInt(row.is_article),
        publishedAt: mysqlTimeStampToDate(row.date_published),
        lang: row.lang,
      } as ParserItem;
    });

    return items;
  }

  /**
   * generates an array of objects each containing an item id/resolved id pair
   *
   * @param itemIds
   */
  private async getItemIdResolvedIdPairs(
    itemIds: number[],
  ): Promise<ItemIdResolvedIdPair[]> {
    const rows = await this.query(
      `SELECT
        ir.item_id,
        ir.resolved_id
      FROM
        readitla_b.items_resolver ir
      WHERE
        ir.item_id IN (?)`,
      [itemIds],
    );

    return rows.map((row) => {
      return {
        itemId: row.item_id,
        // if the parser fails for whatever reason (and it does!), or just takes too long,
        // resolvedId will be zero. watch out!
        resolvedId: row.resolved_id,
      };
    });
  }

  private async getItemAuthors(
    resolvedIdsToItemIdsHash: ResolvedIdToItemIdHash,
  ): Promise<ItemAuthor[]> {
    const resolvedIds = Object.keys(resolvedIdsToItemIdsHash);

    if (!resolvedIds.length) {
      return [];
    }

    const rows = await this.query(
      `SELECT
        ia.item_id as resolved_id,
        a.name
      FROM
        readitla_b.authors a
      INNER JOIN
        readitla_b.items_authors ia ON a.author_id = ia.author_id
      WHERE
        ia.item_id IN (?)`,
      [resolvedIds],
    );

    const result = [];

    rows.forEach((row: any) => {
      const itemId = getItemIdFromResolvedId(
        row.resolved_id,
        resolvedIdsToItemIdsHash,
      );

      // the item should *always* be found by resolved id (as we had to get
      // the resolved id based on the item id), but just in case
      if (itemId > 0) {
        result.push({
          itemId,
          author: row.name.trim(),
        });
      }
    });

    return result;
  }

  /**
   * Private function to get the item content from the content_cache db in mysql
   * @param resolvedIdsToItemIdsHash
   */
  private async getItemContent(
    resolvedIdsToItemIdsHash: ResolvedIdToItemIdHash,
  ): Promise<ContentItemMap> {
    const resolvedIds = Object.keys(resolvedIdsToItemIdsHash);
    const result = {};

    // if there are no resolved ids found (meaning the parser failed
    // or is taking way too long), we return no content
    if (resolvedIds.length == 0) {
      return result;
    }

    const getSql = (tableName) =>
      `SELECT i.item_id as resolved_id, i.content FROM ${tableName} i WHERE i.item_id IN (?)`;

    const rows = (
      await Promise.all([
        contentDb().raw(getSql(`content.content`), [resolvedIds]),
      ])
    )
      .map((result): any[] => result[0])
      .reduce((accumulator, currentValue) => accumulator.concat(currentValue));

    rows.forEach((row: any) => {
      const itemId = getItemIdFromResolvedId(
        row.resolved_id,
        resolvedIdsToItemIdsHash,
      );

      // the item should *always* be found by resolved id (as we had to get
      // the resolved id based on the item id), but just in case
      if (itemId > 0) {
        const buffer: Buffer | undefined = row?.content;
        const content =
          buffer && buffer.length > 0
            ? zlib.inflateSync(buffer).toString()
            : '';

        result[itemId] = {
          itemId,
          content,
        } as ParserContent;
      }
    });

    return result;
  }

  private async query(sql: string, params?: any[]): Promise<any[]> {
    const [result] = await knexDbClient().raw(sql, params);

    return result;
  }
}
