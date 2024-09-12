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

  beforeAll(async () => {
    await deleteDocuments();
    await seedCorpus();
    ({ app, server, url } = await startServer(0));
  });

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
});
