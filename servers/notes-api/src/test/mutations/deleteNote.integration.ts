import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { DELETE_NOTE, GET_NOTE } from '../operations';
import { db, roDb } from '../../datasources/db';
import { sql } from 'kysely';
import { Chance } from 'chance';
import { Note as NoteFaker } from '../fakes/Note';
import { DeleteNoteInput } from '../../__generated__/graphql';

let app: Application;
let server: ApolloServer<IContext>;
let graphQLUrl: string;
const chance = new Chance();
const notes = [...Array(4).keys()].map((_) => NoteFaker(chance));

beforeAll(async () => {
  await sql`truncate table ${sql.table('Note')} CASCADE`.execute(db);
  // port 0 tells express to dynamically assign an available port
  ({ app, server, url: graphQLUrl } = await startServer(0));
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
  await roDb.destroy();
});

describe('note', () => {
  it('deletes a note with a timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[0];
    const input: DeleteNoteInput = {
      id: noteId,
      deletedAt: now.toISOString(),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: DELETE_NOTE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.deleteNote).toEqual(noteId);
    // Do a roundtrip and query back the note
    const noteRoundtrip = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: GET_NOTE, variables: { id: noteId } });
    const note = noteRoundtrip.body.data?.note;
    expect(note.deleted).toBeTrue();
    expect(note.updatedAt).toEqual(now.toISOString());
  });
  it('deletes a note without a timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[1];
    const input: DeleteNoteInput = {
      id: noteId,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: DELETE_NOTE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.deleteNote).toEqual(noteId);
    // Do a roundtrip and query back the Note
    const noteRoundtrip = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: GET_NOTE, variables: { id: noteId } });
    const note = noteRoundtrip.body.data?.note;
    expect(note.deleted).toBeTrue();
    const updatedAt = new Date(note.updatedAt);
    expect(updatedAt.getTime() - now.getTime()).toBeLessThanOrEqual(10000); // within 10 seconds of when this test started
  });
  it('Returns ID for nonexistent note (no errors)', async () => {
    const input: DeleteNoteInput = {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: DELETE_NOTE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.deleteNote).toEqual(input.id);
  });
});
