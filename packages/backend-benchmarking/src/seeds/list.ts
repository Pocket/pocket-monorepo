import Chance from 'chance';

interface ListDataOptions {
  /** The total number of SavedItems to create for a mock user. Defaults to 1000.*/
  count?: number;
  /** The number of results in each iteration (via `next()`). Defaults to 100.*/
  batchSize?: number;
  /** Random chance for a SavedItem to be marked as favorite. Defaults to 0.1 */
  favoriteRate?: number;
  /** Random chance for a SavedItem to be marked as archived. Defaults to 0.2 */
  archiveRate?: number;
  /** Random chance for a SavedItem to be an Article (vs. a Video). Defaults to 0.9 */
  articleRate?: number;
  /** Epoch time (ms). A lower boundary for all timestamp fields. Defaults to 1298613211000 */
  minTimestamp?: number;
  /** Epoch time (ms). An upper boundary for all timestamp fields. Defaults to 1645768411000 */
  maxTimestamp?: number;
}

/** Subset of list entity which can be inserted into legacy schema. */
interface ListEntity {
  user_id: number;
  item_id: number;
  resolved_id: number;
  given_url: string;
  title: string;
  time_added: Date;
  time_updated: Date;
  status: number;
  time_read: Date | undefined;
  favorite: number;
  time_favorited: Date | undefined;
  api_id: string;
  api_id_updated: string;
}

/** Subset of ItemsExtended entity which can be inserted into legacy schema. */
interface ItemsExtendedEntity {
  extended_item_id: number;
  video: number;
  is_article: number;
}

interface ListDataResponse {
  list: ListEntity[];
  items_extended: ItemsExtendedEntity[];
}

/**
 * Generate a mock list for a user. This method returns an iterator which
 * provides data that can be inserted into the list, plus additional metadata
 * used for filters.
 * This just returns data which can be inserted into a test database -- the calling
 * method must handle the database calls.
 * This function is a generator to avoid memory issues when creating very large lists.
 * It should be consumed until it is finished. When the iterator is finished, `value`
 * will be undefined.
 *
 * Example:
 * ```
 * const listGenerator = mockList('abc123');
 * // Get the first batch
 * let batch = myListGenerator.next();
 * while (!batch.done) {
 *   // handle data insert here
 *   // await insertData(batch);
 *   batch = myListGenerator.next();
 * }
 * ```
 *
 * @param userId a fake userId to generate the list
 * @param options options controlling the size of the list, batch in each iteration,
 *  and the mocks (e.g. chance to be favorited or archived).
 */
export function* mockList(
  userId: string,
  options?: ListDataOptions,
): Generator<ListDataResponse> {
  // Set defaults
  const {
    count = 1000,
    batchSize = 100,
    favoriteRate = 0.1,
    archiveRate = 0.2,
    articleRate = 0.9,
    minTimestamp = 1298613211000,
    maxTimestamp = 1645768411000,
  } = options ?? {};

  const chance = new Chance();
  let index = 0;
  const listData = Array(batchSize);
  const extendedData = Array(batchSize);
  // Populate the data
  while (index < count) {
    const timeAdded = chance.integer({ min: minTimestamp, max: maxTimestamp });
    const timeUpdated = chance.integer({ min: timeAdded, max: maxTimestamp });
    const isArchived = Math.random() < archiveRate;
    const isFavorite = Math.random() < favoriteRate;
    const isArticle = Math.random() < articleRate; // otherwise video

    listData[index % batchSize] = {
      user_id: userId,
      item_id: index,
      resolved_id: index,
      given_url: chance.url(),
      // Title is a random sentence between 4 and 12 words
      title: chance.sentence({ words: chance.integer({ min: 4, max: 12 }) }),
      time_added: new Date(timeAdded),
      time_updated: new Date(timeUpdated),
      status: isArchived ? 1 : 0,
      time_read: isArchived
        ? new Date(chance.integer({ min: timeAdded, max: timeUpdated }))
        : undefined,
      favorite: isFavorite ? 1 : 0,
      time_favorited: isFavorite
        ? new Date(chance.integer({ min: timeAdded, max: timeUpdated }))
        : undefined,
      api_id: ['1234', '5678', '1111', '9999'][
        chance.integer({ min: 0, max: 3 })
      ],
      api_id_updated: ['1234', '5678', '1111', '9999'][
        chance.integer({ min: 0, max: 3 })
      ],
    };
    extendedData[index % batchSize] = {
      extended_item_id: index,
      video: isArticle ? 0 : 1,
      is_article: isArticle ? 1 : 0,
    };
    index += 1;
    if (index % batchSize === 0) {
      yield { list: listData, items_extended: extendedData };
    }
  }
  // If the count doesn't evenly divide with batch size, yield what we have  left
  const leftover = index % batchSize;
  if (leftover) {
    yield {
      list: listData.slice(0, leftover),
      items_extended: extendedData.slice(0, leftover),
    };
  }
}
