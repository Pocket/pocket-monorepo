import { resolvers } from './resolvers';
import nock from 'nock';
import { ItemResolverRepository } from './database/mysql';

const urlToParse = 'https://example.com/article-slug';
const itemId = '3';
const articleBody = '<div  lang=\\"en\\"><p>a cool article</p></div>';
let itemRepo: ItemResolverRepository;

describe('Resolvers', () => {
  beforeEach(() => {
    nock('http://example-parser.com')
      .get('/')
      .query({ url: urlToParse, output: 'regular', getItem: '1' })
      .reply(200, {
        article: articleBody,
        item: {
          item_id: itemId,
          resolved_id: itemId,
          given_url: urlToParse,
          normal_url: urlToParse,
          domain_metadata: {
            name: 'domain',
            logo: 'logo',
          },
          authors: {
            1: {
              author_id: 1,
            },
          },
        },
      });
  });

  it('resolves getByUrl Query', async () => {
    const response: any = await resolvers.Query.getItemByUrl(
      null,
      {
        url: urlToParse,
      },
      { repositories: itemRepo },
    );

    expect(response.normalUrl).toBe(urlToParse);
  });

  it('resolves byUrl Query', async () => {
    const response: any = await resolvers.Query.itemByUrl(
      null,
      {
        url: urlToParse,
      },
      { repositories: itemRepo },
    );

    expect(response.normalUrl).toBe(urlToParse);
  });

  it('resolves getByItemId', async () => {
    const mockItemResolverRepository = {
      getResolvedItemById: jest.fn((itemId) => {
        return {
          itemId,
          normalUrl: urlToParse,
        };
      }),
    } as unknown as ItemResolverRepository;

    const context = {
      repositories: {
        itemResolver: mockItemResolverRepository,
      },
    };

    const response: any = await resolvers.Query.getItemByItemId(
      null,
      { id: itemId },
      context,
    );

    expect(response.normalUrl).toBe(urlToParse);
  });

  it('resolves byItemId', async () => {
    const mockItemResolverRepository = {
      getResolvedItemById: jest.fn((itemId) => {
        return {
          itemId,
          normalUrl: urlToParse,
        };
      }),
    } as unknown as ItemResolverRepository;

    const context = {
      repositories: {
        itemResolver: mockItemResolverRepository,
      },
    };

    const response: any = await resolvers.Query.itemByItemId(
      null,
      { id: itemId },
      context,
    );

    expect(response.normalUrl).toBe(urlToParse);
  });
});
