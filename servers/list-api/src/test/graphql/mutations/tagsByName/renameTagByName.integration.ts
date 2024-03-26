import { readClient, writeClient } from '../../../../database/client';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('deleteTagByName mutation', () => {
  //using write client as mutation will use write client to read as well.
  const writeDb = writeClient();
  const readDb = readClient();
  const date = new Date(1711470611 * 1000); // 2024-03-26 16:30:11.000Z
  const now = Math.round(Date.now() / 1000) * 1000;
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const headers = {
    userid: '1',
  };

  const renameTagMutation = `
      mutation renameTagByName($oldName: String!, $newName: String!, $timestamp: ISOString) {
        renameTagByName(oldName: $oldName, newName: $newName, timestamp: $timestamp) {
          name
          savedItems {
            edges {
              node {
                _updatedAt
              }
            }
          }
        }
      }
    `;

  beforeAll(async () => {
    jest.useFakeTimers({
      now: now,
      advanceTimers: true,
    });
    ({ app, server, url } = await startServer(0));
  });
  beforeEach(async () => {
    // Seed data - with tags (0) and without (1)
    await writeDb('list').truncate();
    const listData = [
      { item_id: 0, status: 0, favorite: 0 },
      { item_id: 1, status: 1, favorite: 0 },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date,
        time_read: date,
        time_favorited: date,
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
    });
    await writeDb('list').insert(listData);
    await writeDb('item_tags').truncate();
    const tagData = [
      { item_id: 0, tag: 'ketheric' },
      { item_id: 0, tag: 'gortash' },
      { item_id: 1, tag: 'ketheric' },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        status: 1,
        time_added: date,
        time_updated: date,
        api_id: 'apiid',
        api_id_updated: 'updated_api_id',
      };
    });
    await writeDb('item_tags').insert(tagData);
  });
  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    await server.stop();
  });
  it('should rename a tag and update associated saves', async () => {
    const variables = {
      oldName: 'ketheric',
      newName: 'tav',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: renameTagMutation, variables });
    expect(res.body.data.renameTagByName.name).toEqual('tav');
    const updatedDates = res.body.data.renameTagByName.savedItems.edges.map(
      (edge) => edge.node._updatedAt,
    );
    expect(updatedDates).toEqual([now / 1000, now / 1000]);
  });
  it('accepts a timestamp to rename tag and sets _updatedAt to it for associated Saves', async () => {
    const timestamp = '2024-03-26T16:41:25.000Z';
    const variables = {
      oldName: 'ketheric',
      newName: 'tav',
      timestamp,
    };
    const expectedDate = new Date(timestamp).getTime() / 1000;
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: renameTagMutation, variables });
    expect(res.body.data.renameTagByName.name).toEqual('tav');
    const updatedDates = res.body.data.renameTagByName.savedItems.edges.map(
      (edge) => edge.node._updatedAt,
    );
    expect(updatedDates).toEqual([expectedDate, expectedDate]);
  });
  it('throws NotFoundError if the tag does not exist', async () => {
    const variables = { oldName: 'durge', newName: 'tav' };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: renameTagMutation, variables });
    const error = res.body.errors?.[0];
    expect(error).not.toBeUndefined();
    expect(error.extensions.code).toEqual('NOT_FOUND');
  });
});
