import { faker } from '@faker-js/faker';
import { config } from '../../config';
import * as zlib from 'zlib';
import {
  contentDb,
  knexDbReadClient,
} from '../../datasource/clients/knexClient';

export interface SeedConfig {
  userCount: number;
  listCount: number;
  tagCount: number;
  truncate: boolean;
  forcePremium?: boolean;
}

type ItemDict = {
  itemId: number;
  resolvedId: number;
};

export const getArrayOfIds = (count: number, offset = 1): ItemDict[] => {
  return (
    new Array(count).fill(null).map((e) => (e = offset++)) as number[]
  ).map((itemId) => {
    return { itemId, resolvedId: 10000 + itemId };
  });
};

const seedItems = async (
  itemIds: ItemDict[],
  truncate = true,
): Promise<any> => {
  if (truncate) {
    await knexDbReadClient().table('readitla_b.items_extended').truncate();
    await knexDbReadClient().table('readitla_b.items_resolver').truncate();
  }

  for (let i = 0; i < itemIds.length; i++) {
    const itemDict = itemIds[i];
    const itemId = itemDict.itemId;
    const resolvedId = itemDict.resolvedId;
    const resolver = {
      item_id: itemId,
      normal_url: faker.internet.url(),
      search_hash: faker.string.uuid(),
      resolved_id: resolvedId,
      has_old_dupes: false,
    };
    await knexDbReadClient()
      .table('readitla_b.items_resolver')
      .insert(resolver);

    const resolvedItemResolver = {
      item_id: resolvedId,
      normal_url: faker.internet.url(),
      search_hash: faker.string.uuid(),
      resolved_id: resolvedId,
      has_old_dupes: false,
    };
    await knexDbReadClient()
      .table('readitla_b.items_resolver')
      .insert(resolvedItemResolver);

    const item = {
      extended_item_id: resolvedId,
      resolved_url: resolvedItemResolver.normal_url,
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
    await knexDbReadClient().table('readitla_b.items_extended').insert(item);
  }
};

const seedItemContent = async (
  itemIds: ItemDict[],
  truncate = true,
): Promise<any> => {
  if (truncate) {
    await contentDb().table('content.content').truncate();
  }

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i].resolvedId;
    const item = {
      item_id: itemId,
      content: zlib.deflateSync(
        Buffer.from('string:' + faker.lorem.paragraphs(10)),
      ),
    };

    // insert into the content db
    await contentDb().table('content.content').insert(item);
  }
};

const seedTags = async (
  count: number,
  itemIds: ItemDict[],
  truncate = true,
): Promise<void> => {
  if (truncate) {
    await knexDbReadClient().table('item_tags').truncate();
  }

  const userIds = await knexDbReadClient().select('user_id').from('users');

  if (userIds.length) {
    for (let i = 0; i < count; i++) {
      const tag = {
        user_id: faker.helpers.arrayElement(userIds).user_id,
        item_id: faker.helpers.arrayElement(itemIds).itemId,
        tag: faker.lorem.word(),
        entered_by: faker.lorem.word(),
        time_added: faker.date.past(),
        api_id: faker.number.int(),
        time_updated: faker.date.past(),
        api_id_updated: faker.number.int(),
      };

      await knexDbReadClient().table('item_tags').insert(tag);
    }
  } else {
    console.log('no users! cannot create tags without users...');
  }
};

const seedUsers = async (
  count: number,
  forcePremium = false,
  truncate = true,
): Promise<void> => {
  if (truncate) {
    await knexDbReadClient().table('users').truncate();
    await knexDbReadClient().table('user_recent_search').truncate();
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

    await knexDbReadClient().table('users').insert(user);
    const timeOpts = { min: 12846124, max: new Date().getTime() / 1000 };

    if (user.premium_status == true) {
      // Only premium users can have recent searches
      // create 2 entries for each user -- this allows our tests to ensure premium backfill query selects the most recent login for each user
      const userSearch = {
        user_id: i,
        search: faker.lorem.word(),
        context_key: '',
        context_value: '',
        search_hash: i + '1',
        time_added: faker.number.int(timeOpts),
      };
      await knexDbReadClient().table('user_recent_search').insert(userSearch);

      userSearch.search_hash = i + '2';
      userSearch.time_added = faker.number.int(timeOpts);
      await knexDbReadClient().table('user_recent_search').insert(userSearch);
    }
  }
};

const seedList = async (
  count: number,
  itemIds: ItemDict[],
  truncate = true,
): Promise<void> => {
  if (truncate) {
    await knexDbReadClient().table('list').truncate();
  }

  const userIds = await knexDbReadClient().select('user_id').from('users');

  if (userIds.length) {
    for (let j = 0; j < userIds.length; j++) {
      for (let i = 0; i < count; i++) {
        const list = {
          user_id: userIds[j].user_id,
          item_id: itemIds[i].itemId,
          resolved_id: itemIds[i].resolvedId,
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

        await knexDbReadClient().table('list').insert(list);
      }
    }
  } else {
    console.log('no users! cannot create lists without users...');
  }
};

export const seedItemWithDifferentResolvedId = async (
  itemId: number,
  resolvedId: number,
  truncate = true,
): Promise<void> => {
  if (truncate) {
    await knexDbReadClient().table('readitla_b.items_resolver').truncate();
  }
  await knexDbReadClient().table('readitla_b.items_resolver').insert({
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
      'Woah. This is production. Bailing out before you cause damage.',
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
