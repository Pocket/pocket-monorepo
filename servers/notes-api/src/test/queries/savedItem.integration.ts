import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { NOTES_FROM_SAVE } from '../operations';
import { db, roDb } from '../../datasources/db';
import { Note as NoteFaker } from '../fakes/Note';
import { Chance } from 'chance';
import { sql } from 'kysely';
import { NoteEdge } from '../../__generated__/graphql';
let app: Application;
let server: ApolloServer<IContext>;
let graphQLUrl: string;
const chance = new Chance();
const userId = '1';
const now = Date.now();
const sourceUrl =
  'https://www.youtube.com/watch?v=bqloPw5wp48&pp=ygUMbmF0YWxpZSB3eW5u';
// Seed random other notes but with only one user id
const chaff = [...Array(10).keys()].map((_) => ({
  ...NoteFaker(chance),
  userId,
}));
// Seed notes for the test url
const seed = [...Array(26).keys()].map((_) => ({
  ...NoteFaker(chance),
  userId,
  sourceUrl,
}));
// Ensure at least one of the following cases:
// archived, at a certain time, deleted
seed.push(
  { ...NoteFaker(chance), userId, archived: true, sourceUrl },
  { ...NoteFaker(chance), userId, archived: false, sourceUrl },
  {
    ...NoteFaker(chance),
    userId,
    createdAt: new Date(now),
    sourceUrl,
  },
  { ...NoteFaker(chance), userId, deleted: true, sourceUrl },
);

beforeAll(async () => {
  // port 0 tells express to dynamically assign an available port
  ({ app, server, url: graphQLUrl } = await startServer(0));
  await sql`truncate table ${sql.table('Note')} CASCADE`.execute(db);
  await db
    .insertInto('Note')
    .values(seed)
    .returning(['noteId', 'userId'])
    .execute();
  await db
    .insertInto('Note')
    .values(chaff)
    .returning(['noteId', 'userId'])
    .execute();
});
afterAll(async () => {
  await sql`truncate table ${sql.table('Note')} CASCADE`.execute(db);
  await server.stop();
  await db.destroy();
  await roDb.destroy();
});

describe('resolving from SavedItem', () => {
  it('returns paginated set for only notes on that SavedItem', async () => {
    const variables = { url: sourceUrl, pagination: { first: 10 } };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: NOTES_FROM_SAVE, variables });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities).toBeArrayOfSize(1);
    expect(res.body.data._entities[0]).toMatchObject({
      url: sourceUrl,
    });
    const notes = res.body.data?._entities[0].notes;
    expect(notes?.edges).toBeArrayOfSize(10);
    expect(notes?.totalCount).toEqual(30);
    expect(notes?.pageInfo.hasNextPage).toBeTrue();
    expect(notes?.pageInfo.hasPreviousPage).toBeFalse();
    expect(notes?.pageInfo.startCursor).toEqual(notes?.edges[0].cursor);
    expect(notes?.pageInfo.endCursor).toEqual(
      notes?.edges[notes.edges.length - 1].cursor,
    );
    // Every note should have the same SavedItem url
    const urls = notes.edges
      .map((e: NoteEdge) => e.node?.savedItem?.url)
      .filter((url: string | undefined) => url != null);
    expect(urls).toBeArrayOfSize(10);
    expect(Array.from(new Set(urls))).toBeArrayOfSize(1);
  });
  it('returns only archived notes', async () => {
    const variables = {
      url: sourceUrl,
      pagination: { first: 30 },
      filter: { archived: true },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: NOTES_FROM_SAVE, variables });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities).toBeArrayOfSize(1);
    expect(res.body.data._entities[0]).toMatchObject({
      url: sourceUrl,
    });
    const notes = res.body.data?._entities[0].notes;
    expect(notes.edges).toBeArray();
    expect(notes.edges.length).toBeGreaterThan(0);
    const archivedCount = (notes.edges as Array<NoteEdge>)
      .map((_) => +_.node!.archived)
      .reduce((sum, current) => sum + current, 0);
    expect(archivedCount).toEqual(notes.edges.length);
  });
  it('returns only not-archived notes', async () => {
    const variables = {
      url: sourceUrl,
      pagination: { first: 30 },
      filter: { archived: false },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: NOTES_FROM_SAVE, variables });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities).toBeArrayOfSize(1);
    expect(res.body.data._entities[0]).toMatchObject({
      url: sourceUrl,
    });
    const notes = res.body.data?._entities[0].notes;
    expect(notes.edges).toBeArray();
    expect(notes.edges.length).toBeGreaterThan(0);
    const archivedCount = (notes.edges as Array<NoteEdge>)
      .map((_) => +_.node!.archived)
      .reduce((sum, current) => sum + current, 0);
    expect(archivedCount).toEqual(0);
  });
  it('returns only notes after a timestamp', async () => {
    const variables = {
      url: sourceUrl,
      pagination: { first: 30 },
      filter: { since: new Date(now - 1) },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: NOTES_FROM_SAVE, variables });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities).toBeArrayOfSize(1);
    expect(res.body.data._entities[0]).toMatchObject({
      url: sourceUrl,
    });
    const notes = res.body.data?._entities[0].notes;
    expect(notes?.edges).toBeArray();
    expect(notes.edges.length).toBeGreaterThan(0);
    const isAfter = (notes.edges as Array<NoteEdge>).filter(
      (_) => new Date(_.node!.updatedAt).getTime() > now - 1,
    );
    expect(isAfter.length).toEqual(notes.edges.length);
  });
  it('excludes deleted notes', async () => {
    const variables = {
      url: sourceUrl,
      pagination: { first: 30 },
      filter: { excludeDeleted: true },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set({ userid: userId })
      .send({ query: NOTES_FROM_SAVE, variables });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data._entities).toBeArrayOfSize(1);
    expect(res.body.data._entities[0]).toMatchObject({
      url: sourceUrl,
    });
    const notes = res.body.data?._entities[0].notes;
    expect(notes.edges).toBeArray();
    expect(notes.edges.length).toBeGreaterThan(0);
    const deletedCount = (notes.edges as Array<NoteEdge>)
      .map((_) => +_.node!.deleted)
      .reduce((sum, current) => sum + current, 0);
    expect(deletedCount).toEqual(0);
  });
});
