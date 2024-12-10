import { type ApolloServer } from '@apollo/server';
import request from 'supertest';
import { IContext, startServer } from '../../apollo';
import { type Application } from 'express';
import { GET_NOTES } from '../operations';
import { db } from '../../datasources/db';
import { Note as NoteFaker } from '../fakes/Note';
import { Chance } from 'chance';
import { sql } from 'kysely';
import { NoteEdge } from '../../__generated__/graphql';

let app: Application;
let server: ApolloServer<IContext>;
let graphQLUrl: string;
const chance = new Chance();
const userId = '1';
// Seed notes but with only one user id
const seed = [...Array(27).keys()].map((_) => ({
  ...NoteFaker(chance),
  userId,
}));
const now = Date.now();
// Ensure at least one of the following cases: archived, has url, at a certain time
seed.push(
  { ...NoteFaker(chance), userId, archived: true },
  { ...NoteFaker(chance), userId, sourceUrl: chance.url() },
  {
    ...NoteFaker(chance),
    userId,
    createdAt: new Date(now),
  },
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
});
afterAll(async () => {
  await sql`truncate table ${sql.table('Note')} CASCADE`.execute(db);
  await server.stop();
  await db.destroy();
});

describe('notes', () => {
  describe('pagination', () => {
    it('returns a foward paginated connection', async () => {
      const variables = { pagination: { first: 10 } };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(res.body.errors).toBeUndefined();
      const notes = res.body.data?.notes;
      expect(notes?.edges).toBeArrayOfSize(10);
      expect(notes?.totalCount).toEqual(30);
      expect(notes?.pageInfo.hasNextPage).toBeTrue();
      expect(notes?.pageInfo.hasPreviousPage).toBeFalse();
      expect(notes?.pageInfo.startCursor).toEqual(notes?.edges[0].cursor);
      expect(notes?.pageInfo.endCursor).toEqual(
        notes?.edges[notes.edges.length - 1].cursor,
      );
    });
    it('continues to paginate after a cursor', async () => {
      const variables = { pagination: { first: 10 } };
      const firstPage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      const firstPageCursor = firstPage.body.data?.notes?.pageInfo.startCursor;
      const afterPage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({
          query: GET_NOTES,
          variables: { pagination: { first: 9, after: firstPageCursor } },
        });
      expect(afterPage.body.errors).toBeUndefined();
      const afterRes = afterPage.body.data.notes;
      expect(afterRes.edges).toBeArrayOfSize(9);
      expect(afterRes.edges).toEqual(
        firstPage.body.data?.notes?.edges.slice(1),
      );
    });
    it('returns a backward paginated connection', async () => {
      const variables = { pagination: { last: 10 } };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      const notes = res.body.data?.notes;
      expect(res.body.errors).toBeUndefined();
      expect(notes?.edges).toBeArrayOfSize(10);
      expect(notes?.totalCount).toEqual(30);
      expect(notes?.pageInfo.hasPreviousPage).toBeTrue();
      expect(notes?.pageInfo.hasNextPage).toBeFalse();
      expect(notes?.pageInfo.startCursor).toEqual(notes?.edges[0].cursor);
      expect(notes?.pageInfo.endCursor).toEqual(
        notes?.edges[notes.edges.length - 1].cursor,
      );
    });
    it('continues to paginate backward', async () => {
      const variables = { pagination: { last: 10 } };
      const lastPage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(lastPage.body.errors).toBeUndefined();
      expect(lastPage.body.data?.notes?.edges).toBeArrayOfSize(10);
      expect(lastPage.body.data?.notes?.totalCount).toEqual(30);
      const lastPageCursor = lastPage.body.data?.notes?.pageInfo.endCursor;
      const beforePage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({
          query: GET_NOTES,
          variables: { pagination: { last: 9, before: lastPageCursor } },
        });
      expect(beforePage.body.errors).toBeUndefined();
      const beforeRes = beforePage.body.data.notes;
      expect(beforeRes.edges).toBeArrayOfSize(9);
      expect(beforeRes.edges).toEqual(
        lastPage.body.data?.notes?.edges.slice(0, 9),
      );
    });
    it('last/before lines up with first with proper cursor', async () => {
      const variables = { pagination: { first: 11 } };
      const firstPage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      const firstPageCursor = firstPage.body.data?.notes?.pageInfo.endCursor;
      const beforePage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({
          query: GET_NOTES,
          variables: { pagination: { last: 10, before: firstPageCursor } },
        });
      expect(beforePage.body.errors).toBeUndefined();
      const beforeRes = beforePage.body.data.notes;
      expect(beforeRes.edges).toBeArrayOfSize(10);
      expect(beforeRes.edges).toEqual(
        firstPage.body.data?.notes?.edges.slice(0, 10),
      );
    });
    it('does not have next page if there are no more results', async () => {
      const variables = { pagination: { last: 2 } };
      const lastPage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      const penultimate = lastPage.body.data.notes.pageInfo.startCursor;
      const truncated = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({
          query: GET_NOTES,
          variables: { pagination: { first: 10, after: penultimate } },
        });
      expect(truncated.body.errors).toBeUndefined();
      const notes = truncated.body.data.notes;
      expect(notes.edges).toBeArrayOfSize(1);
      expect(notes.pageInfo.hasNextPage).toBeFalse();
    });
    it('does not have previous page if there are no more results', async () => {
      const variables = { pagination: { first: 2 } };
      const firstPage = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      const penultimate = firstPage.body.data.notes.pageInfo.endCursor;
      const truncated = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({
          query: GET_NOTES,
          variables: { pagination: { last: 10, before: penultimate } },
        });
      expect(truncated.body.errors).toBeUndefined();
      const notes = truncated.body.data.notes;
      expect(notes.edges).toBeArrayOfSize(1);
      expect(notes.pageInfo.hasPreviousPage).toBeFalse();
    });
  });
  describe('sort', () => {
    it('sorts ascending', async () => {
      const variables = {
        pagination: { first: 10 },
        sort: { sortBy: 'CREATED_AT', sortOrder: 'ASC' },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.notes?.edges).toBeArrayOfSize(10);
      expect(res.body.data?.notes?.totalCount).toEqual(30);
      // Same as last in descending order
      const lastVars = {
        pagination: { last: 10 },
        sort: { sortBy: 'CREATED_AT', sortOrder: 'DESC' },
      };
      const lastRes = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables: lastVars });
      const lastEdges = [...lastRes.body.data.notes.edges].reverse();
      expect(lastEdges).toEqual(res.body.data.notes.edges);
    });
    it('sorts descending', async () => {
      const variables = {
        pagination: { first: 10 },
        sort: { sortBy: 'CREATED_AT', sortOrder: 'DESC' },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.notes?.edges).toBeArrayOfSize(10);
      expect(res.body.data?.notes?.totalCount).toEqual(30);
      // Same as last in ascending order
      const lastVars = {
        pagination: { last: 10 },
        sort: { sortBy: 'CREATED_AT', sortOrder: 'ASC' },
      };
      const lastRes = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables: lastVars });
      const lastEdges = [...lastRes.body.data.notes.edges].reverse();
      expect(lastEdges).toEqual(res.body.data.notes.edges);
    });
  });
  describe('filters', () => {
    it('returns only archived notes', async () => {
      const variables = {
        pagination: { first: 10 },
        filter: { archived: true },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.notes?.edges).toBeArray();
      const archivedCount = (res.body.data.notes.edges as Array<NoteEdge>)
        .map((_) => +_.node!.archived)
        .reduce((sum, current) => sum + current, 0);
      expect(archivedCount).toEqual(res.body.data.notes.edges.length);
    });
    it('returns only not-archived notes', async () => {
      const variables = {
        pagination: { first: 10 },
        filter: { archived: false },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.notes?.edges).toBeArray();
      const archivedCount = (res.body.data.notes.edges as Array<NoteEdge>)
        .map((_) => +_.node!.archived)
        .reduce((sum, current) => sum + current, 0);
      expect(archivedCount).toEqual(0);
    });
    it('returns notes after a timestamp', async () => {
      const variables = {
        pagination: { first: 10 },
        filter: { since: new Date(now - 1) },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.notes?.edges).toBeArray();
      expect(res.body.data.notes.edges.length).toBeGreaterThan(0);
      const isAfter = (res.body.data.notes.edges as Array<NoteEdge>).filter(
        (_) => new Date(_.node!.updatedAt).getTime() > now - 1,
      );
      expect(isAfter.length).toEqual(res.body.data.notes.edges.length);
    });
    it('returns notes attached to Save only', async () => {
      const variables = {
        pagination: { first: 10 },
        filter: { isAttachedToSave: true },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set({ userid: userId })
        .send({ query: GET_NOTES, variables });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data?.notes?.edges).toBeArray();
      expect(res.body.data.notes.edges.length).toBeGreaterThan(0);
      const hasSave = (res.body.data.notes.edges as Array<NoteEdge>).filter(
        (_) => _.node!.savedItem != null,
      );
      expect(hasSave.length).toEqual(res.body.data.notes.edges.length);
    });
  });
});
