import { ApolloServer } from '@apollo/server';
import { ContextManager } from '../../../../server/context';
import { readClient, writeClient } from '../../../../database/client';
import { startServer } from '../../../../server/apollo';
import { mockParserGetItemIdRequest } from '../../../utils/parserMocks';
import { Express } from 'express';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import sinon from 'sinon';
import { EventType } from '../../../../businessEvents';

describe('savedItemTag mutation', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z');
  let app: Express;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const eventSpy = sinon.spy(ContextManager.prototype, 'emitItemEvent');

  const SAVEDITEM_TAGS_CREATE = gql`
    mutation saveBatchUpdateTags(
      $input: SavedItemTagInput!
      $timestamp: ISOString!
    ) {
      savedItemTag(input: $input, timestamp: $timestamp) {
        url
        _updatedAt
        tags {
          name
        }
      }
    }
  `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  beforeEach(async () => {
    sinon.resetHistory();
    await writeDb('list').truncate();
    await writeDb('item_tags').truncate();
    const listDataBase = {
      user_id: 1,
      title: 'mytitle',
      time_added: date,
      time_updated: date,
      time_read: date,
      time_favorited: date,
      api_id: 'apiid',
      status: 0,
      favorite: 0,
      api_id_updated: 'apiid',
    };
    const tagsDataBase = {
      user_id: 1,
      status: 1,
      time_added: date,
      time_updated: date,
      api_id: 'apiid',
      api_id_updated: 'apiid',
    };
    await writeDb('list').insert([
      {
        ...listDataBase,
        item_id: 1,
        resolved_id: 1,
        given_url: 'http://abc',
      },
      {
        ...listDataBase,
        item_id: 2,
        resolved_id: 2,
        given_url: 'http://def',
      },
    ]);
    await writeDb('item_tags').insert([
      {
        ...tagsDataBase,
        item_id: 1,
        tag: 'tobio',
      },
      {
        ...tagsDataBase,
        item_id: 1,
        tag: 'shoyo',
      },
    ]);
  });
  afterAll(async () => {
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
  });
  it('should add tags to a SavedItem with no tags', async () => {
    const givenUrl = 'http://def';
    mockParserGetItemIdRequest(givenUrl, '2');
    const timestamp = '2023-05-12T10:58:00.000Z';
    const variables = {
      input: {
        givenUrl,
        tagNames: ['sugawara', 'daiichi'],
      },
      timestamp,
    };
    const expected = {
      savedItemTag: {
        url: givenUrl,
        _updatedAt: Math.round(new Date(timestamp).getTime() / 1000),
        tags: expect.toIncludeSameMembers([
          { name: 'sugawara' },
          { name: 'daiichi' },
        ]),
      },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVEDITEM_TAGS_CREATE),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toStrictEqual(expected);
  });
  it('should add tags to a SavedItem with tags already, preserving old tags', async () => {
    const givenUrl = 'http://abc';
    mockParserGetItemIdRequest(givenUrl, '1');
    const timestamp = '2023-05-12T10:58:00.000Z';
    const variables = {
      input: {
        givenUrl,
        tagNames: ['sugawara', 'daiichi'],
      },
      timestamp,
    };
    const expected = {
      savedItemTag: {
        url: givenUrl,
        _updatedAt: Math.round(new Date(timestamp).getTime() / 1000),
        tags: expect.toIncludeSameMembers([
          { name: 'sugawara' },
          { name: 'daiichi' },
          { name: 'shoyo' },
          { name: 'tobio' },
        ]),
      },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVEDITEM_TAGS_CREATE),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toStrictEqual(expected);
  });
  it('should not throw an error if the tag already exists, and not duplicate', async () => {
    const givenUrl = 'http://abc';
    mockParserGetItemIdRequest(givenUrl, '1');
    const timestamp = '2023-05-12T10:58:00.000Z';
    const variables = {
      input: {
        givenUrl,
        tagNames: ['shoyo'],
      },
      timestamp,
    };
    const expected = {
      savedItemTag: {
        url: givenUrl,
        _updatedAt: Math.round(new Date(timestamp).getTime() / 1000),
        tags: expect.toIncludeSameMembers([
          { name: 'shoyo' },
          { name: 'tobio' },
        ]),
      },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVEDITEM_TAGS_CREATE),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toStrictEqual(expected);
  });
  it('should add new tags even if passed a tag that already exists', async () => {
    const givenUrl = 'http://abc';
    mockParserGetItemIdRequest(givenUrl, '1');
    const timestamp = '2023-05-12T10:58:00.000Z';
    const variables = {
      input: {
        givenUrl,
        tagNames: ['shoyo', 'sugawara'],
      },
      timestamp,
    };
    const expected = {
      savedItemTag: {
        url: givenUrl,
        _updatedAt: Math.round(new Date(timestamp).getTime() / 1000),
        tags: expect.toIncludeSameMembers([
          { name: 'shoyo' },
          { name: 'tobio' },
          { name: 'sugawara' },
        ]),
      },
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVEDITEM_TAGS_CREATE),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toStrictEqual(expected);
  });
  it('should include NOT_FOUND in errors array if no SavedItem exists with the givenUrl', async () => {
    const givenUrl = 'http://hij';
    mockParserGetItemIdRequest(givenUrl, null);
    const timestamp = '2023-05-12T10:58:00.000Z';
    const variables = {
      input: {
        givenUrl,
        tagNames: ['shoyo'],
      },
      timestamp,
    };
    const expectedData = { savedItemTag: null };
    const expectedError = expect.toIncludeAllMembers([
      expect.objectContaining({
        extensions: {
          code: 'NOT_FOUND',
        },
        message: expect.stringContaining(
          "Not Found: SavedItem with givenUrl='http://hij' does not exist",
        ),
      }),
    ]);
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVEDITEM_TAGS_CREATE),
        variables,
      });
    expect(res.body.errors).toStrictEqual(expectedError);
    expect(res.body.data).toStrictEqual(expectedData);
  });
  it('should emit add_tags event on success', async () => {
    const givenUrl = 'http://abc';
    mockParserGetItemIdRequest(givenUrl, '1');
    const timestamp = '2023-05-12T10:58:00.000Z';
    const variables = {
      input: {
        givenUrl,
        tagNames: ['sugawara', 'daiichi'],
      },
      timestamp,
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(SAVEDITEM_TAGS_CREATE),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(eventSpy.callCount).toEqual(1);
    const eventData = eventSpy.getCall(0).args;
    const expectedEventCall = [
      EventType.ADD_TAGS,
      expect.objectContaining({ id: 1, url: 'http://abc' }),
      expect.toIncludeSameMembers(['sugawara', 'daiichi']),
    ];
    expect(eventData).toStrictEqual(expectedEventCall);
  });
});
