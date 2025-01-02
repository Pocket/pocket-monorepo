import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { CREATE_NOTE } from '../operations';
import { db } from '../../datasources/db';
import { sql } from 'kysely';
import { CreateNoteInput } from '../../__generated__/graphql';
import basicText from '../documents/basicText.json';
import { Chance } from 'chance';

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
    const input: CreateNoteInput = {
      docContent: JSON.stringify(basicText),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: CREATE_NOTE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.createNote).toMatchObject({
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
    // The keys get reordered so we have to deeply compare the
    // JSON-serialized results
    const receivedDoc = res.body.data?.createNote?.docContent;
    expect(receivedDoc).not.toBeNil();
    expect(JSON.parse(receivedDoc)).toStrictEqual(basicText);
  });
  it('creates a note with optional fields', async () => {
    const chance = new Chance();
    const createdAt = new Date(chance.hammertime());
    const input: CreateNoteInput = {
      title: chance.sentence(),
      createdAt,
      source: chance.url(),
      id: chance.guid({ version: 4 }),
      docContent: JSON.stringify(basicText),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: CREATE_NOTE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.createNote).toMatchObject({
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
  });
  it('throws error for duplicate UUID', async () => {
    const uuid = 'ccab26fb-64a5-4071-9044-f42bc2470884';
    const input: CreateNoteInput = {
      docContent: JSON.stringify(basicText),
    };
    const seed = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({
        query: CREATE_NOTE,
        variables: { input: { ...input, id: uuid } },
      });
    expect(seed.body.errors).toBeNil();
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({
        query: CREATE_NOTE,
        variables: { input: { ...input, id: uuid } },
      });
    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('BAD_USER_INPUT');
    expect(res.body.errors[0].message).toMatch(
      'Received duplicate value for note ID',
    );
  });
  it('throws error for bad JSON', async () => {
    const input: CreateNoteInput = {
      docContent: "{ 'bad': 'json'",
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: CREATE_NOTE, variables: { input } });

    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('BAD_USER_INPUT');
    expect(res.body.errors[0].message).toMatch(
      'Received malformed JSON for docContent',
    );
  });
});
