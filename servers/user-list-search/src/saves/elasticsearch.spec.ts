import { faker } from '@faker-js/faker';
import { IndexDocument, createDocument, getContentType } from './elasticsearch';
import {
  ListItemEnriched,
  ParserItem,
  listItemStatusToString,
} from '../datasource/DataSourceInterface';
import { normalizeDate, normalizeFullText } from '../shared/util';

describe('elasticsearch', () => {
  let dateCreated: Date;
  let datePublished: Date;
  let item: ParserItem;

  beforeEach(() => {
    dateCreated = faker.date.recent();
    datePublished = faker.date.past();

    item = {
      itemId: 1,
      normalUrl: 'https://superbad.com',
      title: 'superbad!',
      excerpt: 'weird deconstructist art that made the internet cool',
      isArticle: false,
      hasVideo: false,
      hasImage: false,
      resolvedId: 2,
      publishedAt: datePublished,
      domainId: 10,
      wordCount: 444,
      lang: 'en-US',
    };
  });

  describe('getContentType', () => {
    it('should handle no content types', () => {
      expect(getContentType(item)).toStrictEqual([]);
    });

    it('should handle isArticle', () => {
      item.isArticle = true;

      expect(getContentType(item)).toStrictEqual([
        'article',
        'articles',
        'web',
      ]);
    });

    it('should handle hasVideo', () => {
      item.hasVideo = true;

      expect(getContentType(item)).toStrictEqual(['video', 'videos', 'web']);
    });

    it('should handle hasImage', () => {
      item.hasImage = true;

      expect(getContentType(item)).toStrictEqual(['image', 'images', 'web']);
    });
  });

  describe('createDocument', () => {
    let lie: ListItemEnriched;
    let expected: IndexDocument;

    beforeEach(() => {
      lie = {
        userId: 1,
        itemId: 1,
        status: 0,
        favorite: true,
        givenUrl: 'https://superbad.com',
        tags: [],
        createdAt: dateCreated,
        item,
      };

      expected = {
        action: 'index',
        tags: [],
        user_id: 1,
        title: 'superbad!',
        resolved_id: 2,
        item_id: 1,
        url: 'https://superbad.com',
        full_text: normalizeFullText(null),
        excerpt: normalizeFullText(
          // these normalize functions are tested elsewhere - no need to repeat here
          'weird deconstructist art that made the internet cool',
        ),
        date_published: normalizeDate(datePublished),
        date_added: normalizeDate(dateCreated),
        domain_id: 10,
        content_type: getContentType(lie.item),
        word_count: 444,
        lang: 'en-US',
        favorite: true,
        status: listItemStatusToString(0),
      };
    });

    it('should return a SearchDocument without tags, authors, or content', () => {
      expect(createDocument(lie)).toStrictEqual(expected);
    });

    it('should return a SearchDocument with tags, authors, and content', () => {
      const tags = ['letsgo', 'bowling'];
      const authors = ['maude lebowski', 'Fawn Knutsen'];
      const content = 'lotta ins, lotta outs';

      lie.tags = tags;
      lie.item.authors = authors;
      lie.item.content = content;

      expected.tags = tags;
      expected.authors = authors;
      expected.full_text = normalizeFullText(content);

      expect(createDocument(lie)).toStrictEqual(expected);
    });
  });
});
