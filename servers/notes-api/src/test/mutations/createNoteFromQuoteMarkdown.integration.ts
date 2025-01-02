import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { CREATE_NOTE_QUOTE_MD } from '../operations';
import { db } from '../../datasources/db';
import { sql } from 'kysely';
import { CreateNoteFromQuoteMarkdownInput } from '../../__generated__/graphql';
import fromQuote from '../documents/fromQuote.json';
import { Chance } from 'chance';
import * as fs from 'fs';
import path from 'path';

const fromQuoteMd = fs.readFileSync(
  path.resolve(__dirname, '../documents/fromQuoteMd.txt'),
  'utf8',
);

let app: Application;
let server: ApolloServer<IContext>;
let graphQLUrl: string;

beforeAll(async () => {
  // port 0 tells express to dynamically assign an available port
  ({ app, server, url: graphQLUrl } = await startServer(0));
});
afterAll(async () => {
  await sql`truncate table ${sql.table('Note')} CASCADE`.execute(db);
  await server.stop();
  await db.destroy();
});

describe('note', () => {
  it('creates a note with minimal inputs', async () => {
    const input: CreateNoteFromQuoteMarkdownInput = {
      quote: fromQuoteMd,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: CREATE_NOTE_QUOTE_MD, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.createNoteFromQuoteMarkdown).toMatchObject({
      archived: false,
      contentPreview: expect.toBeString(),
      createdAt: expect.toBeDateString(),
      deleted: false,
      id: expect.toBeString(),
      savedItem: null,
      source: null,
      title: null,
      updatedAt: expect.toBeDateString(),
    });
    // The keys may get reordered so we have to deeply compare the
    // JSON-serialized results
    const receivedDoc = res.body.data?.createNoteFromQuoteMarkdown?.docContent;
    expect(receivedDoc).not.toBeNil();
    expect(JSON.parse(receivedDoc)).toStrictEqual(fromQuote.expectedNoSource);
  });
  it('creates a note with optional fields', async () => {
    const chance = new Chance();
    const createdAt = new Date(chance.hammertime());
    const input: CreateNoteFromQuoteMarkdownInput = {
      title: chance.sentence(),
      createdAt,
      source: 'localhost:3001',
      id: chance.guid({ version: 4 }),
      quote: fromQuoteMd,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: CREATE_NOTE_QUOTE_MD, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.createNoteFromQuoteMarkdown).toMatchObject({
      archived: false,
      contentPreview: expect.toBeString(),
      createdAt: new Date(
        Math.round(createdAt.getTime() / 1000) * 1000,
      ).toISOString(),
      deleted: false,
      id: input.id,
      savedItem: {
        url: input.source,
      },
      source: input.source,
      title: input.title,
      updatedAt: createdAt.toISOString(),
    });
    // The keys may get reordered so we have to deeply compare the
    // JSON-serialized results
    const receivedDoc = res.body.data?.createNoteFromQuoteMarkdown?.docContent;
    expect(receivedDoc).not.toBeNil();
    expect(JSON.parse(receivedDoc)).toStrictEqual(fromQuote.expectedSource);
  });
  it('throws error for duplicate UUID', async () => {
    const uuid = 'ccab26fb-64a5-4071-9044-f42bc2470884';
    const input: CreateNoteFromQuoteMarkdownInput = {
      quote: JSON.stringify(fromQuote.input),
    };
    const seed = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({
        query: CREATE_NOTE_QUOTE_MD,
        variables: { input: { ...input, id: uuid } },
      });
    expect(seed.body.errors).toBeNil();
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({
        query: CREATE_NOTE_QUOTE_MD,
        variables: { input: { ...input, id: uuid } },
      });
    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('BAD_USER_INPUT');
    expect(res.body.errors[0].message).toMatch(
      'Received duplicate value for note ID',
    );
  });
});
