import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { SavedItemImportInput } from '../../../types';
import { mockParserGetItemRequest } from '../../utils/parserMocks';
import { restore, cleanAll } from 'nock';
import { writeClient } from '../../../database/client';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';

describe('batchImport mutation', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const eventMock = jest
    .spyOn(PocketEventBridgeClient.prototype, 'sendPocketEvent')
    .mockResolvedValue();
  const db = writeClient();
  const headers = {
    userid: '1',
    encodedid: 'abc123',
  };
  const importUrls = ['https://igiveyou.a.test', 'http://local.com'];
  const batch: SavedItemImportInput[] = [
    {
      url: importUrls[0],
      createdAt: '2024-10-30T12:39:28.023Z',
      title: 'this title',
      tags: ['test', 'small'],
      status: 'UNREAD',
    },
    {
      url: importUrls[1],
      createdAt: '2024-10-30T12:39:28.023Z',
      title: 'this title',
      tags: [],
      status: 'UNREAD',
    },
  ];
  const batchImportMutation = `
      mutation batchImport($input: [BatchImportInput!]!) {
        batchImport(input: $input)
      }
    `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  beforeEach(async () => {
    await db('list').truncate();
    await db('item_tags').truncate();
    mockParserGetItemRequest(importUrls[0], {
      item: {
        given_url: importUrls[0],
        item_id: 8,
        resolved_id: 9,
        title: 'The Not Evil Search Engine',
      },
    });
    mockParserGetItemRequest(importUrls[1], {
      item: {
        given_url: importUrls[1],
        item_id: 10,
        resolved_id: 11,
        title: 'An Accordion from 1927',
      },
    });
  });
  afterEach(() => jest.clearAllMocks());
  afterAll(async () => {
    jest.restoreAllMocks();
    await server.stop();
    restore();
    cleanAll();
    await db('list').truncate();
    await db('item_tags').truncate();
    await db.destroy();
  });
  it('works for a user with no tags', async () => {
    const noTags: SavedItemImportInput[] = [
      {
        url: importUrls[0],
        createdAt: '2024-10-30T12:39:28.023Z',
        title: 'this title',
        tags: [],
        status: 'UNREAD',
      },
      {
        url: importUrls[1],
        createdAt: '2024-10-30T12:39:28.023Z',
        title: 'this title',
        tags: [],
        status: 'UNREAD',
      },
    ];
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: batchImportMutation, variables: { input: noTags } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.batchImport).toBeTrue();
    const list = await db('list').where('user_id', '1');
    expect(list).toIncludeSameMembers([
      expect.objectContaining({ given_url: importUrls[0] }),
      expect.objectContaining({ given_url: importUrls[1] }),
    ]);
  });
  it('imports data into the list', async () => {
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: batchImportMutation, variables: { input: batch } });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.batchImport).toBeTrue();
    const list = await db('list').where('user_id', '1');
    const tags = await db('item_tags').where('user_id', '1');
    expect(list).toIncludeSameMembers([
      expect.objectContaining({ given_url: importUrls[0] }),
      expect.objectContaining({ given_url: importUrls[1] }),
    ]);
    expect(tags).toIncludeSameMembers([
      expect.objectContaining({ tag: 'small' }),
      expect.objectContaining({ tag: 'test' }),
    ]);
  });
  it('sends event to event bridge with expected payload', async () => {
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: batchImportMutation, variables: { input: batch } });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.batchImport).toBeTrue();
    expect(eventMock).toHaveBeenCalledTimes(2);
    const eventPayload = eventMock.mock.calls[0][0];
    const eventDetail = eventPayload.detail;
    expect(eventPayload).toMatchObject({
      source: 'list-api',
      'detail-type': 'ADD_ITEM',
    });
    expect(eventDetail).toMatchObject({
      savedItem: {
        url: importUrls[0],
        id: 8,
      },
    });
  });
});
