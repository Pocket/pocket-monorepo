import { deleteDocuments, seedCorpus } from '../test/utils/corpusSeeder';
import { SEARCH_CORPUS } from '../test/queries/corpusSearch';
import { startServer } from '../server/serverUtils';
import { ContextManager } from '../server/context';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { EventBus } from '../events/EventBus';
import { config } from '../config';

describe('Corpus search - keyword', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const defaultHeaders = { userid: '1', applicationisnative: 'true' };
  const eventSpy = jest
    .spyOn(EventBus.prototype, 'sendCorpusSearchResultEvent')
    .mockResolvedValue();
  // Force keyword search
  const embeddingsEnabled = config.aws.elasticsearch.corpus.embeddings.enabled;

  beforeAll(async () => {
    config.aws.elasticsearch.corpus.embeddings.enabled = false;
    await deleteDocuments();
    await seedCorpus();
    ({ app, server, url } = await startServer(0));
  });
  afterAll(async () => {
    config.aws.elasticsearch.corpus.embeddings.enabled = embeddingsEnabled;
    jest.restoreAllMocks();
    await deleteDocuments();
    await server.stop();
  });
  it('should call event emitter with result', async () => {
    const variables = {
      search: { query: 'refrigerator' },
      filter: { language: 'EN' },
    };
    const res = await request(app)
      .post(url)
      .set({ userid: 'anonymous', applicationisnative: 'true' })
      .send({
        query: print(SEARCH_CORPUS),
        variables,
      });
    expect(eventSpy).toHaveBeenCalledOnce();
    expect(eventSpy.mock.calls[0][0]).toMatchObject(res.body.data.searchCorpus);
    expect(eventSpy.mock.calls[0][2]).toEqual(variables); // same structure as args
  });
  it('should work for logged-out users using a pocket application', async () => {
    const variables = {
      search: { query: 'refrigerator' },
      filter: { language: 'EN' },
    };
    const res = await request(app)
      .post(url)
      .set({ userid: 'anonymous', applicationisnative: 'true' })
      .send({
        query: print(SEARCH_CORPUS),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.searchCorpus).toBeTruthy();
  });
  it('should not work for logged-out users on a non-native app', async () => {
    const variables = {
      search: { query: 'refrigerator' },
      filter: { language: 'EN' },
    };
    const res = await request(app)
      .post(url)
      .set({ userid: 'anonymous', applicationisnative: 'false' })
      .send({
        query: print(SEARCH_CORPUS),
        variables,
      });
    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('FORBIDDEN');
    expect(res.body.data.searchCorpus).toBeNull();
  });
  it('should return all expected fields and work with minimum required inputs', async () => {
    const variables = {
      search: { query: 'refrigerator' },
      filter: { language: 'EN' },
    };
    const res = await request(app)
      .post(url)
      .set(defaultHeaders)
      .send({
        query: print(SEARCH_CORPUS),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toEqual({
      searchCorpus: {
        edges: [
          {
            cursor: expect.toBeString(),
            node: {
              url: 'https://www.wired.com/story/get-rich-peeping-inside-fridges/',
              searchHighlights: {
                fullText: [
                  'As the founder and managing partner of Trinetra, a London-based investment firm, Stassopoulos has pioneered an unusual strategy: peeking inside <em>refrigerators</em>',
                ],
                title: null,
                excerpt: null,
                publisher: null,
              },
            },
          },
        ],
        pageInfo: {
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        totalCount: 1,
      },
    });
  });
  describe('search', () => {
    it('title field', async () => {
      const variables = {
        search: { query: 'love', field: 'TITLE' },
        filter: { language: 'EN' },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expected = expect.objectContaining({
        totalCount: 2,
        edges: expect.toIncludeSameMembers([
          {
            cursor: expect.toBeString(),
            node: {
              url: 'https://www.newyorker.com/magazine/2024/07/08/diorama-of-love-addie-citchens',
              searchHighlights: {
                fullText: null,
                title: ['Diorama of <em>Love</em>'],
                excerpt: null,
                publisher: null,
              },
            },
          },
          {
            cursor: expect.toBeString(),
            node: {
              url: 'https://greatergood.berkeley.edu/article/item/six_misconceptions_we_have_about_romantic_love',
              searchHighlights: {
                fullText: null,
                title: [
                  'Six Misconceptions We Have About Romantic <em>Love</em>',
                ],
                excerpt: null,
                publisher: null,
              },
            },
          },
        ]),
      });
      expect(res.body.data).not.toBeUndefined();
      expect(res.body.data.searchCorpus).toEqual(expected);
    });
    it('excerpt field', async () => {
      const variables = {
        search: { query: 'srinivas', field: 'EXCERPT' },
        filter: {
          language: 'EN',
        },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expectedUrls = [
        'https://www.404media.co/perplexitys-origin-story-scraping-twitter-with-fake-academic-accounts/',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('content field', async () => {
      const variables = {
        search: { query: 'videospiel', field: 'EXTRACTED_CONTENT' },
        filter: {
          language: 'DE',
        },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expectedUrls = [
        'https://www.freitag.de/autoren/the-guardian/rasenmaehen-als-computerspiel-nach-30-minuten-hatte-ich-das-gefuehl-ich-sterbe',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('publisher field', async () => {
      const variables = {
        search: { query: 'new yorker', field: 'PUBLISHER' },
        filter: {
          language: 'EN',
        },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expectedUrls = [
        'https://www.newyorker.com/magazine/2024/07/08/diorama-of-love-addie-citchens',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
  });
  describe('filters', () => {
    it('publisher', async () => {
      const variables = {
        search: { query: 'LGBTQIA' },
        filter: { language: 'EN', publisher: 'pocket' },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      const expectedUrls = ['pocket-pride-reads'];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    describe('publishedDateRange', () => {
      it('after only', async () => {
        const variables = {
          search: { query: 'love' },
          filter: {
            language: 'EN',
            publishedDateRange: {
              after: new Date(1719792000000).toISOString(),
            },
          },
        };
        const res = await request(app)
          .post(url)
          .set(defaultHeaders)
          .send({
            query: print(SEARCH_CORPUS),
            variables,
          });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).not.toBeUndefined();
        const expectedUrls = [
          'https://greatergood.berkeley.edu/article/item/six_misconceptions_we_have_about_romantic_love',
          'https://www.newyorker.com/magazine/2024/07/08/diorama-of-love-addie-citchens',
          'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
        ];
        expect(res.body.data.searchCorpus.totalCount).toEqual(3);
        const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
        expect(urls).toIncludeSameMembers(expectedUrls);
      });
      it('before only', async () => {
        const variables = {
          search: { query: 'love' },
          filter: {
            language: 'EN',
            publishedDateRange: {
              before: new Date(1719792000000).toISOString(),
            },
          },
        };
        const res = await request(app)
          .post(url)
          .set(defaultHeaders)
          .send({
            query: print(SEARCH_CORPUS),
            variables,
          });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).not.toBeUndefined();
        const expectedUrls = [
          'https://getpocket.com/explore/item/the-50-most-romantic-quotes-from-books-poetry-and-plays',
        ];
        expect(res.body.data.searchCorpus.totalCount).toEqual(1);
        const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
        expect(urls).toIncludeSameMembers(expectedUrls);
      });
      it('range (after + before)', async () => {
        const variables = {
          search: { query: 'love' },
          filter: {
            language: 'EN',
            publishedDateRange: {
              after: new Date(1719792000000).toISOString(),
              before: new Date(1719878400000).toISOString(),
            },
          },
        };
        const res = await request(app)
          .post(url)
          .set(defaultHeaders)
          .send({
            query: print(SEARCH_CORPUS),
            variables,
          });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).not.toBeUndefined();
        const expectedUrls = [
          'https://www.newyorker.com/magazine/2024/07/08/diorama-of-love-addie-citchens',
          'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
        ];
        expect(res.body.data.searchCorpus.totalCount).toEqual(2);
        const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
        expect(urls).toIncludeSameMembers(expectedUrls);
      });
    });
    describe('addedDateRange', () => {
      it('after only', async () => {
        const variables = {
          search: { query: 'love' },
          filter: {
            language: 'EN',
            addedDateRange: {
              after: new Date(1719870437000).toISOString(),
            },
          },
        };
        const res = await request(app)
          .post(url)
          .set(defaultHeaders)
          .send({
            query: print(SEARCH_CORPUS),
            variables,
          });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).not.toBeUndefined();
        const expectedUrls = [
          'https://greatergood.berkeley.edu/article/item/six_misconceptions_we_have_about_romantic_love',
          'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
        ];
        expect(res.body.data.searchCorpus.totalCount).toEqual(2);
        const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
        expect(urls).toIncludeSameMembers(expectedUrls);
      });
      it('before only', async () => {
        const variables = {
          search: { query: 'love' },
          filter: {
            language: 'EN',
            addedDateRange: {
              before: new Date(1719781832001).toISOString(),
            },
          },
        };
        const res = await request(app)
          .post(url)
          .set(defaultHeaders)
          .send({
            query: print(SEARCH_CORPUS),
            variables,
          });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).not.toBeUndefined();
        const expectedUrls = [
          'https://getpocket.com/explore/item/the-50-most-romantic-quotes-from-books-poetry-and-plays',
        ];
        expect(res.body.data.searchCorpus.totalCount).toEqual(1);
        const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
        expect(urls).toIncludeSameMembers(expectedUrls);
      });
      it('range (after + before)', async () => {
        const variables = {
          search: { query: 'love' },
          filter: {
            language: 'EN',
            addedDateRange: {
              after: new Date(1719870437000).toISOString(),
              before: new Date(1720020073000).toISOString(),
            },
          },
        };
        const res = await request(app)
          .post(url)
          .set(defaultHeaders)
          .send({
            query: print(SEARCH_CORPUS),
            variables,
          });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).not.toBeUndefined();
        const expectedUrls = [
          'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
        ];
        expect(res.body.data.searchCorpus.totalCount).toEqual(1);
        const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
        expect(urls).toIncludeSameMembers(expectedUrls);
      });
    });
    it('one content type', async () => {
      const variables = {
        search: { query: 'architektur' },
        filter: { language: 'DE', contentType: ['COLLECTION'] },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      const expectedUrls = [
        'nachhaltige-architektur-der-zukunft-squirrel-news',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('multiple content types', async () => {
      const variables = {
        search: { query: 'queer' },
        filter: { language: 'DE', contentType: ['VIDEO', 'ARTICLE'] },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      const expectedUrls = [
        'https://www.glamour.de/artikel/selfcare-lgbtqia-experte',
        'https://www.ndr.de/kultur/buch/sachbuecher/Queere-Geschichte-vom-Kaiserreich-bis-heute-Historiker-im-Gespraech,queer128.html',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(2);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('multiple topics', async () => {
      const variables = {
        search: { query: 'love' },
        filter: { language: 'EN', topic: ['EDUCATION', 'POLITICS'] },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expectedUrls = [
        'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
        'https://greatergood.berkeley.edu/article/item/six_misconceptions_we_have_about_romantic_love',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(2);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('one topic', async () => {
      const variables = {
        search: { query: 'love' },
        filter: { language: 'EN', topic: ['EDUCATION'] },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expectedUrls = [
        'https://greatergood.berkeley.edu/article/item/six_misconceptions_we_have_about_romantic_love',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('excludeML', async () => {
      const variables = {
        search: { query: 'love' },
        filter: { language: 'EN', excludeML: true },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      const expectedUrls = [
        'https://getpocket.com/explore/item/the-50-most-romantic-quotes-from-books-poetry-and-plays',
        'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(2);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('author', async () => {
      const variables = {
        search: { query: 'queer' },
        filter: { language: 'DE', author: 'gammerl' },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expectedUrls = [
        'https://www.ndr.de/kultur/buch/sachbuecher/Queere-Geschichte-vom-Kaiserreich-bis-heute-Historiker-im-Gespraech,queer128.html',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
    it('combination', async () => {
      const variables = {
        search: { query: 'love' },
        filter: {
          language: 'EN',
          topic: ['POLITICS', 'ENTERTAINMENT'],
          author: 'wiedeman',
          contentType: ['COLLECTION', 'ARTICLE'],
          excludeML: true,
          excludeCollections: true,
          publishedDateRange: { after: new Date(1719792000000).toISOString() },
        },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const expectedUrls = [
        'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
      ];
      expect(res.body.data.searchCorpus.totalCount).toEqual(1);
      const urls = res.body.data.searchCorpus.edges.map((e) => e.node.url);
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
  });

  describe('pagination', () => {
    it('works with first value alone', async () => {
      const variables = {
        search: { query: 'love' },
        filter: { language: 'EN' },
        pagination: { first: 3 },
      };
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      expect(res.body.errors).toBeUndefined();
      const expected = {
        edges: expect.toBeArrayOfSize(3),
        pageInfo: {
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        totalCount: 4,
      };
      expect(res.body.data.searchCorpus).toEqual(expected);
    });
    it('finishes pagination from cursor (first/after)', async () => {
      const expectedUrls = [
        'https://greatergood.berkeley.edu/article/item/six_misconceptions_we_have_about_romantic_love',
        'https://www.newyorker.com/magazine/2024/07/08/diorama-of-love-addie-citchens',
        'https://getpocket.com/explore/item/the-50-most-romantic-quotes-from-books-poetry-and-plays',
        'https://www.thecut.com/article/nda-non-disclosure-agreement-popularity.html',
      ];
      const variables = {
        search: { query: 'love' },
        filter: { language: 'EN' },
        pagination: { first: 3 },
      };
      const firstRes = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables,
        });
      const cursor = firstRes.body.data.searchCorpus.pageInfo.endCursor;
      const res = await request(app)
        .post(url)
        .set(defaultHeaders)
        .send({
          query: print(SEARCH_CORPUS),
          variables: { ...variables, pagination: { first: 3, after: cursor } },
        });
      expect(res.body.errors).toBeUndefined();
      const expected = {
        edges: expect.toBeArrayOfSize(1),
        pageInfo: {
          startCursor: expect.toBeString(),
          endCursor: expect.toBeString(),
        },
        totalCount: 4,
      };
      expect(res.body.data.searchCorpus).toEqual(expected);
      const urls = [firstRes, res].flatMap((r) =>
        r.body.data.searchCorpus.edges.map((e) => e.node.url),
      );
      expect(urls).toIncludeSameMembers(expectedUrls);
    });
  });
});
