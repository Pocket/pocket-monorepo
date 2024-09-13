import * as sem from './semanticSearch';
import * as kw from './keywordSearch';
import {
  SemanticSearchQueryBuilder,
  SimpleQueryStringBuilder,
} from './CorpusSearchQueryBuilder';
import { CorpusSearchModel } from './CorpusSearchModel';
import { CorpusLanguage } from '../__generated__/types';
import { config } from '../config';

describe('searchCorpus', () => {
  const fakeResponse = { hits: { total: 0, hits: [] } };
  const queryVec = jest.spyOn(SemanticSearchQueryBuilder, 'getQueryVec');
  const semSpy = jest
    .spyOn(sem, 'semanticSearch')
    .mockResolvedValue(fakeResponse as any);
  const kwSpy = jest
    .spyOn(kw, 'keywordSearch')
    .mockResolvedValue(fakeResponse as any);

  const semanticFallback = config.unleash.flags.semanticSearch.fallback;

  beforeAll(() => {
    // Set unleash fallback value (it's not initialized here)
    config.unleash.flags.semanticSearch.fallback = true;
  });

  afterAll(() => {
    jest.restoreAllMocks();
    // Restore value
    config.unleash.flags.semanticSearch.fallback = semanticFallback;
  });
  afterEach(() => jest.clearAllMocks());
  it('falls back to keyword search if embeddings are not received', async () => {
    queryVec.mockResolvedValueOnce(undefined);
    const result = await SemanticSearchQueryBuilder.fromQueryString({
      search: { query: 'refrigerator' },
      filter: { language: CorpusLanguage.En },
    });
    expect(result instanceof SimpleQueryStringBuilder).toBeTrue();
  });
  it('performs keyword search for unsupported languages', async () => {
    await new CorpusSearchModel({} as any).search({
      search: { query: 'refrigerator' },
      // NOTE: Will need to be updated as this changes
      filter: { language: CorpusLanguage.It },
    });
    expect(kwSpy).toHaveBeenCalledOnce();
    expect(semSpy).not.toHaveBeenCalled();
  });
  it('performs semantic search for supported languages', async () => {
    queryVec.mockResolvedValueOnce([1, 2, 3]);
    await new CorpusSearchModel({} as any).search({
      search: { query: 'refrigerator' },
      // NOTE: Will need to be updated as this changes
      filter: { language: CorpusLanguage.En },
    });
    expect(semSpy).toHaveBeenCalledOnce();
    expect(kwSpy).not.toHaveBeenCalled();
  });
});
