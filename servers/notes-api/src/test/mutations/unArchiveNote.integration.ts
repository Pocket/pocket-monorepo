import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { UNARCHIVE_NOTE } from '../operations';
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

describe('unArchiveNote', () => {
  it('unarchives a note with timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[0];

    const input = {
      id: noteId,
      updatedAt: now.toISOString(),
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: UNARCHIVE_NOTE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.unArchiveNote).toMatchObject({
      archived: expect.toBeFalse(),
      updatedAt: now.toISOString(),
    });
  });
  it('archives a note without a timestamp', async () => {
    const now = new Date(Date.now());
    const { userId, noteId } = notes[1];
    const input = {
      id: noteId,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: UNARCHIVE_NOTE, variables: { input } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data?.unArchiveNote).toMatchObject({
      archived: expect.toBeFalse(),
      updatedAt: expect.toBeDateString(),
    });
    const updatedAt = new Date(res.body.data?.unArchiveNote?.updatedAt);
    expect(updatedAt.getTime() - now.getTime()).toBeLessThanOrEqual(10000); // within 10 seconds of when this test started
  });
  it('includes not found error for nonexistent note', async () => {
    const input = {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: '1' })
      .send({ query: UNARCHIVE_NOTE, variables: { input } });
    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toEqual('NOT_FOUND');
  });
});
