import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { EDIT_NOTE_CONTENT } from '../operations';
import { db } from '../../datasources/db';
import { sql } from 'kysely';
import { Chance } from 'chance';
import { Note as NoteFaker } from '../fakes/Note';
import { EditNoteContentInput } from '../../__generated__/graphql';
import basicText from '../documents/basicText.json';

let app: Application;
let server: ApolloServer<IContext>;
let graphQLUrl: string;
const chance = new Chance();
const notes = [...Array(4).keys()].map((_) => NoteFaker(chance));

beforeAll(async () => {
  // port 0 tells express to dynamically assign an available port
  ({ app, server, url: graphQLUrl } = await startServer(0));
  await sql`truncate table ${sql.table('Note')} CASCADE`.execute(db);
  await db
    .insertInto('Note')
    .values(notes)
    .returning(['noteId', 'userId'])
    .execute();
});
afterAll(async () => {
  await sql`truncate table ${sql.table('Note')} CASCADE`.execute(db);
  await server.stop();
  await db.destroy();
});

describe('note', () => {
  it('edits a note content with a timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[0];

    const input: EditNoteContentInput = {
      noteId,
      docContent: JSON.stringify(basicText),
      updatedAt: now.toISOString(),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: EDIT_NOTE_CONTENT, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.editNoteContent).toMatchObject({
      docContent: expect.toBeString(),
      updatedAt: now.toISOString(),
    });
    // The keys get reordered so we have to deeply compare the
    // JSON-serialized results
    const receivedDoc = res.body.data?.editNoteContent?.docContent;
    expect(receivedDoc).not.toBeNil();
    expect(JSON.parse(receivedDoc)).toStrictEqual(basicText);
  });
  it('edits a note title without a timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[1];
    const input: EditNoteContentInput = {
      noteId,
      docContent: JSON.stringify(basicText),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: EDIT_NOTE_CONTENT, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.editNoteContent).toMatchObject({
      docContent: expect.toBeString(),
      updatedAt: expect.toBeDateString(),
    });
    const updatedAt = new Date(res.body.data?.editNoteContent?.updatedAt);
    expect(updatedAt.getTime() - now.getTime()).toBeLessThanOrEqual(10000); // within 10 seconds of when this test started
    // The keys get reordered so we have to deeply compare the
    // JSON-serialized results
    const receivedDoc = res.body.data?.editNoteContent?.docContent;
    expect(receivedDoc).not.toBeNil();
    expect(JSON.parse(receivedDoc)).toStrictEqual(basicText);
  });
  it('includes not found error for nonexistent note', async () => {
    const input: EditNoteContentInput = {
      noteId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      docContent: JSON.stringify(basicText),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: EDIT_NOTE_CONTENT, variables: { input } });
    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('NOT_FOUND');
  });
  it('throws error for bad JSON', async () => {
    const { userId, noteId } = notes[2];
    const input: EditNoteContentInput = {
      noteId,
      docContent: "{ 'bad': 'json'",
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: EDIT_NOTE_CONTENT, variables: { input } });

    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('BAD_USER_INPUT');
    expect(res.body.errors[0].message).toMatch(
      'Received malformed JSON for docContent',
    );
  });
});
