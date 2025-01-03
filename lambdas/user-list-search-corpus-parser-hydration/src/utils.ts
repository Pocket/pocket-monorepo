import { BulkRequestMeta } from './types.ts';

/**
 * This method is copied in user-list-search-corpus-indexing
 * (sharing lambda code is really annoying and not worth it for just this)
 * Create a URL from the collection slug and language.
 * Sometimes URLs are already passed to the event in the
 * slug field, or at least were historically; just allow
 * these to go through without parsing.
 * @param slug the collection's slug (possibly a full URL)
 * @param langCode the language of the collection (case-insensitive)
 * @returns the URL where the collection is hosted on pocket.com,
 * if it exists
 */
export function buildCollectionUrl(slug: string, langCode: string): string {
  // english-language does not have 'en'
  const lang = langCode.toLowerCase();
  const collectionLang = lang === 'en' ? '' : lang;
  try {
    new URL(slug);
  } catch {
    return ['https://getpocket.com', collectionLang, 'collections', slug]
      .filter((_) => _.length)
      .join('/');
  }
  return slug;
}

export function hasExcerptOrIsCollection(request: BulkRequestMeta): boolean {
  return (
    request.isCollection ||
    !(request.excerpt == null || request.excerpt?.trim().length === 0)
  );
}
