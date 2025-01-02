import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { EDIT_NOTE_TITLE } from '../operations';
import { db } from '../../datasources/db';
import { sql } from 'kysely';
import { Chance } from 'chance';
import { Note as NoteFaker } from '../fakes/Note';

let app: Application;
let server: ApolloServer<IContext>;
let graphQLUrl: string;
const chance = new Chance();
const notes = [...Array(4).keys()].map((_) => NoteFaker(chance));

beforeAll(async () => {
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
});

describe('note', () => {
  it('edits a note title with a timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[0];

    const input = {
      id: noteId,
      title: 'Why I Stopped Worrying and Started Loving My Fungus',
      updatedAt: now.toISOString(),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: EDIT_NOTE_TITLE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.editNoteTitle).toMatchObject({
      title: 'Why I Stopped Worrying and Started Loving My Fungus',
      updatedAt: now.toISOString(),
    });
  });
  it('edits a note title without a timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[1];
    const input = {
      id: noteId,
      title: `How To Talk To Your Kids About Bloodstone Rituals`,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: EDIT_NOTE_TITLE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.editNoteTitle).toMatchObject({
      title: `How To Talk To Your Kids About Bloodstone Rituals`,
      updatedAt: expect.toBeDateString(),
    });
    const updatedAt = new Date(res.body.data?.editNoteTitle?.updatedAt);
    expect(updatedAt.getTime() - now.getTime()).toBeLessThanOrEqual(10000); // within 10 seconds of when this test started
  });
  it('includes not found error for nonexistent note', async () => {
    const input = {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      title: `How To Talk To Your Kids About Bloodstone Rituals`,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: EDIT_NOTE_TITLE, variables: { input } });
    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('NOT_FOUND');
  });
});
