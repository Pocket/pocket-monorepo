import { primaryPool } from './mysql';
import { faker } from '@faker-js/faker';
import { config } from '../../config';
import * as zlib from 'zlib';
import { RowDataPacket } from 'mysql2';

export interface SeedConfig {
  userCount: number;
  listCount: number;
  tagCount: number;
  truncate: boolean;
  forcePremium?: boolean;
}

export const getArrayOfIds = (count: number, offset = 1): number[] => {
  return new Array(count).fill(null).map((e) => (e = offset++)) as number[];
};

const seedItems = async (itemIds: number[], truncate = true): Promise<any> => {
  if (truncate) {
    await primaryPool.query('TRUNCATE TABLE readitla_b.items_extended');
    await primaryPool.query('TRUNCATE TABLE readitla_b.items_resolver');
  }

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i];
    const resolver = {
      item_id: itemId,
      normal_url: faker.internet.url(),
      search_hash: faker.string.uuid(),
      resolved_id: itemId,
      has_old_dupes: false,
    };
    await primaryPool.query(
      `INSERT INTO readitla_b.items_resolver SET ?`,
      resolver
    );

    const item = {
      extended_item_id: itemId,
      resolved_url: resolver.normal_url,
      domain_id: faker.number.int(),
      origin_domain_id: faker.number.int(),
      response_code: 200,
      mime_type: 'text/html',
      content_length: faker.number.int(),
      encoding: 'utf-8',
      date_resolved: faker.date.past(),
      date_published: faker.date.past(),
      title: faker.lorem.words(5),
      excerpt: faker.lorem.words(50),
      word_count: faker.number.int(),
      innerdomain_redirect: false,
      digest_parsed: false,
      image: faker.datatype.boolean(),
      video: faker.datatype.boolean(),
      is_index: faker.datatype.boolean(),
      is_article: faker.datatype.boolean(),
      used_fallback: faker.datatype.boolean(),
      lang: faker.location.countryCode('alpha-2').toLowerCase(),
    };
    await primaryPool.query(
      `INSERT INTO readitla_b.items_extended SET ?`,
      item
    );
  }
};

const seedItemContent = async (
  itemIds: number[],
  truncate = true
): Promise<any> => {
  if (truncate) {
    await primaryPool.query('TRUNCATE TABLE content.content');
  }

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i];
    const item = {
      item_id: itemId,
      content: zlib.deflateSync(
        Buffer.from('string:' + faker.lorem.paragraphs(10))
      ),
    };

    // insert into the content db
    await primaryPool.query(`INSERT INTO content.content SET ?`, item);
  }
};

const seedTags = async (
  count: number,
  itemIds: number[],
  truncate = true
): Promise<void> => {
  if (truncate) {
    await primaryPool.query('TRUNCATE TABLE item_tags');
  }

  const [users] = await primaryPool.query<RowDataPacket[]>(
    'SELECT user_id FROM users'
  );

  if (users.length) {
    for (let i = 0; i < count; i++) {
      const tag = {
        user_id: (faker.helpers.arrayElement(users) as any).user_id,
        item_id: faker.helpers.arrayElement(itemIds),
        tag: faker.lorem.word(),
        entered_by: faker.lorem.word(),
        time_added: faker.date.past(),
        api_id: faker.number.int(),
        time_updated: faker.date.past(),
        api_id_updated: faker.number.int(),
      };

      await primaryPool.query(`INSERT INTO item_tags SET ?`, tag);
    }
  } else {
    console.log('no users! cannot create items without users...');
  }
};

const seedUsers = async (
  count: number,
  forcePremium = false,
  truncate = true
): Promise<void> => {
  if (truncate) {
    await primaryPool.query('TRUNCATE TABLE users');
    await primaryPool.query('TRUNCATE TABLE user_recent_search');
  }

  for (let i = 1; i <= count; i++) {
    const user = {
      feed_id: i,
      password: faker.internet.password(),
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      feed_protected: faker.datatype.boolean(),
      login_hash: faker.internet.password(),
      birth: faker.date.past(),
      last_syncer: faker.lorem.word(),
      api_id: faker.number.int(),
      premium_status: forcePremium ? true : faker.datatype.boolean(),
    };

    await primaryPool.query(`INSERT INTO users SET ?`, user);
    const timeOpts = { min: 12846124, max: new Date().getTime() / 1000 };

    // create 2 entries for each user -- this allows our tests to ensure premium backfill query selects the most recent login for each user
    const userSearch = {
      user_id: i,
      search: faker.lorem.word(),
      context_key: '',
      context_value: '',
      search_hash: i + '1',
      time_added: faker.number.int(timeOpts),
    };
    await primaryPool.query(`INSERT INTO user_recent_search SET ?`, userSearch);

    userSearch.search_hash = i + '2';
    userSearch.time_added = faker.number.int(timeOpts);
    await primaryPool.query(`INSERT INTO user_recent_search SET ?`, userSearch);
  }
};

const seedList = async (
  count: number,
  itemIds: number[],
  truncate = true
): Promise<void> => {
  if (truncate) {
    await primaryPool.query('TRUNCATE TABLE list');
  }

  const [users] = await primaryPool.query<RowDataPacket[]>(
    'SELECT user_id FROM users'
  );

  if (users.length) {
    for (let j = 0; j < users.length; j++) {
      for (let i = 0; i < count; i++) {
        const list = {
          user_id: users[j].user_id,
          item_id: itemIds[i],
          resolved_id: faker.number.int(),
          given_url: faker.internet.url(),
          title: faker.lorem.sentence().slice(0, 74),
          time_added: faker.date.past(),
          time_updated: faker.date.past(),
          time_read: faker.date.past(),
          time_favorited: faker.date.past(),
          api_id: faker.number.int(),
          status: 1,
          api_id_updated: faker.number.int(),
        };

        await primaryPool.query(`INSERT INTO list SET ?`, list);
      }
    }
  } else {
    console.log('no users! cannot create items without users...');
  }
};

export const seedItemWithDifferentResolvedId = async (
  itemId: number,
  resolvedId: number,
  truncate = true
): Promise<void> => {
  if (truncate) {
    await primaryPool.query('TRUNCATE TABLE readitla_b.items_resolver');
  }
  await primaryPool.query('INSERT INTO readitla_b.items_resolver SET ?', {
    item_id: itemId,
    resolved_id: resolvedId,
    search_hash: '',
    has_old_dupes: false,
  });
};

// generates random items ids to be used in both
// `list` and `item_tags` tables
export const seedDb = async (opts: SeedConfig): Promise<any> => {
  if (config.isProduction) {
    console.error(
      'Woah. This is production. Bailing out before you cause damage.'
    );
    return;
  }

  const { userCount, listCount, tagCount, truncate, forcePremium } = opts;

  // items ids to share across list and item_tags tables
  const itemIds = getArrayOfIds(listCount);
  await seedUsers(userCount, forcePremium, truncate);

  await Promise.all([
    seedItemContent(itemIds, truncate),
    seedItems(itemIds, truncate),
    seedList(listCount, itemIds, truncate),
    seedTags(tagCount, itemIds, truncate),
  ]);
};
