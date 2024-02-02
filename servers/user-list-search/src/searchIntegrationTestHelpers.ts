import { Knex } from 'knex';

export async function loadItemExtended(
  db,
  itemId,
  url,
  title,
  wordCount,
  isArticle = 1,
  isImage = 0,
  isVideo = 0,
  lang = `en`,
) {
  await db('readitla_b.items_extended').insert({
    extended_item_id: itemId,
    resolved_url: url,
    title: title,
    word_count: wordCount,
    lang: lang,
    is_article: isArticle,
    image: isImage,
    video: isVideo,
    domain_id: itemId + 7,
    origin_domain_id: itemId + 5,
    response_code: 200,
    mime_type: 'text/html',
    content_length: 100,
    encoding: 'utf-8',
    date_resolved: new Date('2020-10-03 10:20:30'),
    date_published: new Date('2020-10-03 10:20:30'),
    excerpt: 'some excerpt values',
    innerdomain_redirect: false,
    digest_parsed: false,
    is_index: 1,
    used_fallback: 0,
  });
}
export async function loadList(
  db: Knex,
  favorite: number,
  itemId: number,
  status: number,
  title: string,
  url: string,
  date: Date,
) {
  await db('readitla_ril-tmp.list').insert({
    item_id: itemId,
    status: status,
    favorite: favorite,
    user_id: 1,
    resolved_id: itemId,
    given_url: url,
    title: title,
    time_added: date,
    time_updated: date,
    time_read: status == 1 ? date : '0000-00-00 00:00:00',
    time_favorited: date,
    api_id: 'apiid',
    api_id_updated: 'apiid',
  });
}
