import {
  AddResponse,
  PendingAddResponse,
  SavedItemWithParserMetadata,
} from '../types.js';
import * as tx from '../shared/transforms.js';

export function AddItemTransformer(
  savedItem: SavedItemWithParserMetadata,
): AddResponse | PendingAddResponse {
  let item: AddResponse['item'];
  let pendingItem: PendingAddResponse['item'];
  const nullKeys: Array<keyof PendingAddResponse['item']> = [
    'resolved_url',
    'domain_id',
    'origin_domain_id',
    'response_code',
    'mime_type',
    'content_length',
    'encoding',
    'date_resolved',
    'date_published',
    'title',
    'excerpt',
    'word_count',
    'innerdomain_redirect',
    'login_required',
    'has_image',
    'has_video',
    'is_index',
    'is_article',
    'used_fallback',
    'lang',
    'time_first_parsed',
  ];
  const base = nullKeys.reduce(
    (obj, key) => {
      obj[key] = null;
      return obj;
    },
    {} as Omit<
      PendingAddResponse['item'],
      'item_id' | 'given_url' | 'normal_url' | 'resolved_id'
    >,
  );
  switch (savedItem.item.__typename) {
    case 'PendingItem':
      pendingItem = {
        ...base,
        item_id: savedItem.id,
        given_url: savedItem.url,
        normal_url: savedItem.url,
        resolved_id: '0',
      };
      return { item: pendingItem, status: 1 };
    case 'Item':
      item = {
        item_id: savedItem.id,
        normal_url: savedItem.item.normalUrl,
        resolved_id: savedItem.item.resolvedId,
        resolved_url: savedItem.item.resolvedUrl,
        domain_id: savedItem.item.domainId,
        origin_domain_id: savedItem.item.originDomainId,
        response_code: savedItem.item.responseCode.toString(),
        mime_type: savedItem.item.mimeType,
        content_length: savedItem.item.contentLength.toString(),
        encoding: savedItem.item.encoding ?? '',
        date_resolved: savedItem.item.dateResolved,
        date_published: savedItem.item.datePublished ?? '0000-00-00 00:00:00',
        title: savedItem.item.title ?? '',
        excerpt: savedItem.item.excerpt ?? '',
        word_count: (savedItem.item.wordCount ?? 0).toString(),
        innerdomain_redirect: savedItem.item.innerDomainRedirect ? '1' : '0',
        login_required: savedItem.item.loginRequired ? '1' : '0',
        has_image: tx.convertHasImage(savedItem.item.hasImage),
        has_video: tx.convertHasVideo(savedItem.item.hasVideo),
        is_index: savedItem.item.isIndex ? '1' : '0',
        is_article: savedItem.item.isArticle ? '1' : '0',
        used_fallback: savedItem.item.usedFallback ? '1' : '0',
        lang: savedItem.item.language,
        time_first_parsed: savedItem.item.timeFirstParsed,
        authors: tx.AuthorsReducer(savedItem.item.authors) ?? [],
        images:
          tx.ImagesReducer(savedItem.item.images, savedItem.item.resolvedId) ??
          [],
        videos:
          tx.VideosReducer(savedItem.item.videos, savedItem.item.resolvedId) ??
          [],
        resolved_normal_url: savedItem.item.resolvedNormalUrl ?? '',
        given_url: savedItem.url,
      };
      // Optional fields -- not present if data does not exist
      savedItem.item.topImage &&
        (item['top_image_url'] = savedItem.item.topImage.url);
      savedItem.item.domainMetadata &&
        (item['domain_metadata'] = tx.DomainMetadataTransformer(
          savedItem.item.domainMetadata,
        ));
      return { item, status: 1 };
  }
}
