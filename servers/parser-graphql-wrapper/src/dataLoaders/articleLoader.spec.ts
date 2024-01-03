import nock from 'nock';
import {
  batchGetArticleTextByUrl,
  getArticleByUrl,
  ParserArticle,
} from './articleLoader';

function mockArticleTextRequest(urlToParse, articleBody) {
  nock('http://example-parser.com')
    .get('/')
    .query({ url: urlToParse, getItem: '1', output: 'regular' })
    .reply(200, { article: articleBody, item: { given_url: urlToParse } });
}

describe('article loader', () => {
  const urlToParse1 = 'https://example.com/article-slug';
  const articleBody1 = '<div  lang=\\"en\\"><p>a cool article</p></div>';
  const articleBody2 = '<div  lang=\\"en\\"><p>a cool article</p></div>';
  const urlToParse2 = 'https://example.com/article-slug-2';

  beforeEach(() => {
    mockArticleTextRequest(urlToParse1, articleBody1);
    mockArticleTextRequest(urlToParse2, articleBody2);
  });

  it('gets a single article body', async () => {
    const response: ParserArticle = await getArticleByUrl(urlToParse1);
    expect(response).toEqual({
      article: articleBody1,
      givenUrl: urlToParse1,
      images: null,
      videos: null,
    });
  });

  it('gets multiple article bodies', async () => {
    const response: ParserArticle[] = await batchGetArticleTextByUrl([
      urlToParse1,
      urlToParse2,
    ]);
    expect(response.length).toBe(2);
    expect(response).toContainEqual({
      article: articleBody1,
      givenUrl: urlToParse1,
      images: null,
      videos: null,
    });
    expect(response).toContainEqual({
      article: articleBody2,
      givenUrl: urlToParse2,
      images: null,
      videos: null,
    });
  });
});
