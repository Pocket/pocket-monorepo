import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { GET_NOTE } from '../operations';
import { db, roDb } from '../../datasources/db';
import { Note as NoteFaker } from '../fakes/Note';
import { Chance } from 'chance';
import { sql } from 'kysely';
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
  await roDb.destroy();
});

describe('note', () => {
  it.each(notes)('returns note data', async (noteSeed) => {
    const { userId, noteId } = noteSeed;
    const variables = { id: noteId };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: GET_NOTE, variables });
    expect(res.body.errors).toBeUndefined();
    const note = res.body.data?.note;
    // Matchers
    expect(note).not.toBeUndefined();
    expect(note.createdAt).toBeDateString();
    expect(note.updatedAt).toBeDateString();
    expect(note.id).toEqual(noteId);
    expect(note.deleted).toEqual(noteSeed.deleted);
    expect(note.archived).toEqual(noteSeed.archived);
    // Convert undefined to null for comparator
    expect(note.title).toEqual(noteSeed.title ?? null);
    expect(note.source).toEqual(noteSeed.sourceUrl ?? null);
    if (noteSeed.docContent != null) {
      expect(JSON.parse(note.docContent)).toEqual(noteSeed.docContent);
      expect(note.contentPreview).toBeString();
    } else {
      expect(note.docContent).toBeNull();
      expect(note.contentPreview).toBeNull();
    }
    if (noteSeed.sourceUrl != null) {
      expect(note.savedItem).toEqual({
        url: noteSeed.sourceUrl,
      });
    } else {
      expect(note.savedItem).toBeNull();
    }
  });
});
