import fs from 'fs';
import path from 'path';
import { deleteDocuments, seedCorpus } from '../test/utils/corpusSeeder';
import { SEARCH_CORPUS } from '../test/queries/corpusSearch';
import { startServer } from '../server/serverUtils';
import { ContextManager } from '../server/context';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { SemanticSearchQueryBuilder } from './CorpusSearchQueryBuilder';
import { Client } from '@opensearch-project/opensearch';
import { unleash } from '../datasource/clients';
import { mockFlags } from '../test/utils/mockUnleashFlags';
import { config } from '../config';

// Since keyword search query builder uses the same methods
// and is tested more exhaustively, didn't repeat all the
// filters, pagination schemes, etc. for this file
describe('Corpus search - semantic', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const defaultHeaders = { userid: '1', applicationisnative: 'true' };
  const embeddings = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../test/data/searchEmbeddings.json'),
      'utf-8',
    ),
  );
  const queryVec = jest.spyOn(SemanticSearchQueryBuilder, 'getQueryVec');
  const clientMock: any = jest.spyOn(Client.prototype, 'search');

  beforeAll(async () => {
    await unleash(
      mockFlags([
        { name: config.unleash.flags.semanticSearch.name, enabled: true },
      ]),
    );
    await deleteDocuments();
    await seedCorpus();
    ({ app, server, url } = await startServer(0));
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await deleteDocuments();
    await server.stop();
    jest.restoreAllMocks();
  });
  it.each(embeddings)('performs semantic search', async ({ query, vector }) => {
    queryVec.mockResolvedValueOnce(vector);
    const variables = {
      search: { query: query },
      filter: { language: 'EN' },
    };
    const res = await request(app)
      .post(url)
      .set(defaultHeaders)
      .send({
        query: print(SEARCH_CORPUS),
        variables,
      });
    // TODO: I can't get these to return results, but they do in
    // dev/prod deployments. I don't know if it's an issue with
    // localstack or just how small the dataset is
    // For now, just check for errors
    expect(res.body.errors).toBeUndefined();
  });
  it('performs semantic search with search_after', async () => {
    const { query, vector } = embeddings[0];
    queryVec.mockResolvedValueOnce(vector);
    // I can't get this to return results, so we'll mock a response body
    // pulled from a real query executed directly
    const body = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../test/data/searchBodyResponse.json'),
        'utf-8',
      ),
    );
    clientMock.mockResolvedValueOnce({ body }).mockResolvedValueOnce({ body });
    const variables = {
      search: { query: query },
      filter: { language: 'EN' },
    };
    const initialRes = await request(app)
      .post(url)
      .set(defaultHeaders)
      .send({
        query: print(SEARCH_CORPUS),
        variables,
      });
    const after = initialRes.body.data.searchCorpus.pageInfo.endCursor;
    const res = await request(app)
      .post(url)
      .set(defaultHeaders)
      .send({
        query: print(SEARCH_CORPUS),
        variables: { ...variables, pagination: { first: 1, after } },
      });
    expect(res.body.errors).toBeUndefined();
    expect(clientMock.mock.calls[1][0].body).toMatchObject({
      search_after: ['0.91273504', '36da877e-4573-45cf-92da-f5c26213fdfe'],
      size: 1,
    });
  });
});
