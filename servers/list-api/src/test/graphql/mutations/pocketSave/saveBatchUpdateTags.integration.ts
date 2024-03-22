import { ApolloServer } from '@apollo/server';
import { ContextManager } from '../../../../server/context';
import { readClient, writeClient } from '../../../../database/client';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { TagModel } from '../../../../models';

describe('saveBatchUpdateTags', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z');
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const BATCH_UPDATE_TAGS = gql`
    mutation saveBatchUpdateTags(
      $input: [SaveUpdateTagsInput!]!
      $timestamp: ISOString!
    ) {
      saveBatchUpdateTags(input: $input, timestamp: $timestamp) {
        save {
          id
          tags {
            name
          }
        }
        errors {
          __typename
          ... on BaseError {
            path
            message
          }
        }
      }
    }
  `;

  const GET_TAGS_FOR_SAVE = gql`
    query getTagsSave($userId: ID!, $itemIds: [ID!]!) {
      _entities(representations: { id: $userId, __typename: "User" }) {
        ... on User {
          saveById(ids: $itemIds) {
            ... on PocketSave {
              tags {
                name
              }
            }
          }
        }
      }
    }
  `;
  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  beforeEach(async () => {
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
    await writeDb.destroy();
    await readDb.destroy();
    await server.stop();
  });
  it('adds one or more tags to a save that already has tags', async () => {
    const variables = {
      userId: '1',
      input: {
        saveId: '1',
        removeTagIds: [],
        addTagNames: ['daichi', 'asahi', 'sugawara'],
      },
      timestamp: '2023-02-23T20:23:00.000Z',
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    const expectedTags = [
      { name: 'tobio' },
      { name: 'shoyo' },
      { name: 'daichi' },
      { name: 'asahi' },
      { name: 'sugawara' },
    ];
    expect(res.body.data.saveBatchUpdateTags.save).toBeArrayOfSize(1);
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toIncludeSameMembers(
      expectedTags,
    );
    expect(res.body.data.saveBatchUpdateTags.errors).toBeArrayOfSize(0);
  });
  it('adds one or more tags to a save that has no tags', async () => {
    const variables = {
      userId: '1',
      input: {
        saveId: '2',
        removeTagIds: [],
        addTagNames: ['daichi', 'asahi', 'sugawara'],
      },
      timestamp: '2023-02-23T20:23:00.000Z',
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expectedTags = [
      { name: 'daichi' },
      { name: 'asahi' },
      { name: 'sugawara' },
    ];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save).toBeArrayOfSize(1);
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toIncludeSameMembers(
      expectedTags,
    );
    expect(res.body.data.saveBatchUpdateTags.errors).toBeArrayOfSize(0);
  });
  it('deletes one or more tags from a save with tags', async () => {
    const removeTagIds = ['shoyo', 'tobio'].map((tag) =>
      TagModel.encodeId(tag),
    );
    const variables = {
      userId: '1',
      input: {
        saveId: '1',
        removeTagIds,
        addTagNames: [],
      },
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save).toBeArrayOfSize(1);
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toBeArrayOfSize(0);
    expect(res.body.data.saveBatchUpdateTags.errors).toBeArrayOfSize(0);
  });
  it('does not fail when adding a tag that already exists on a save, and updates _createdAt', async () => {
    const variables = {
      userId: '1',
      input: {
        saveId: '1',
        removeTagIds: [],
        addTagNames: ['tobio', 'sugawara'],
      },
      timestamp: '2023-02-23T20:23:00.000Z',
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expectedTags = [
      { name: 'tobio' },
      { name: 'shoyo' },
      { name: 'sugawara' },
    ];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save).toBeArrayOfSize(1);
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toIncludeSameMembers(
      expectedTags,
    );
    expect(res.body.data.saveBatchUpdateTags.errors).toBeArrayOfSize(0);
  });
  it('deletes and adds tags at the same time', async () => {
    const removeTagIds = [TagModel.encodeId('tobio')];
    const variables = {
      userId: '1',
      input: {
        saveId: '1',
        removeTagIds,
        addTagNames: ['sugawara'],
      },
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expectedTags = [{ name: 'shoyo' }, { name: 'sugawara' }];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save).toBeArrayOfSize(1);
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toIncludeSameMembers(
      expectedTags,
    );
    expect(res.body.data.saveBatchUpdateTags.errors).toBeArrayOfSize(0);
  });
  it('does not throw error if deleting a tag that does not exist (no-op)', async () => {
    const removeTagId = TagModel.encodeId('oikawa');
    const variables = {
      userId: '1',
      input: {
        saveId: '1',
        removeTagIds: [removeTagId],
        addTagNames: ['sugawara'],
      },
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expectedTags = [
      { name: 'tobio' },
      { name: 'shoyo' },
      { name: 'sugawara' },
    ];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save).toBeArrayOfSize(1);
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toIncludeSameMembers(
      expectedTags,
    );
  });
  it('deletes and adds tags for more than one save', async () => {
    const removeTagIds = ['shoyo', 'tobio'].map((tag) =>
      TagModel.encodeId(tag),
    );
    const variables = {
      userId: '1',
      input: [
        {
          saveId: '1',
          removeTagIds,
          addTagNames: ['daichi', 'asahi', 'sugawara'],
        },
        {
          saveId: '2',
          removeTagIds: [],
          addTagNames: ['osamu', 'atsumu'],
        },
      ],
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expected = [
      {
        id: '1',
        tags: expect.toIncludeSameMembers([
          { name: 'daichi' },
          { name: 'asahi' },
          { name: 'sugawara' },
        ]),
      },
      {
        id: '2',
        tags: expect.toIncludeSameMembers([
          { name: 'osamu' },
          { name: 'atsumu' },
        ]),
      },
    ];
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save).toMatchObject(expected);
  });
  it('fails the entire batch and rolls back if encounter NOT_FOUND save', async () => {
    const variables = {
      userId: '1',
      input: [
        {
          saveId: '1',
          removeTagIds: [],
          addTagNames: ['nishinoya'],
        },
        {
          saveId: '3',
          removeTagIds: [],
          addTagNames: ['tanaka'],
        },
      ],
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expectedErrors = [
      {
        __typename: 'NotFound',
        message: `Entity identified by key=saveId, value=3 was not found.`,
        path: 'saveBatchUpdateTags',
      },
    ];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.errors).toIncludeSameMembers(
      expectedErrors,
    );
    expect(res.body.data.saveBatchUpdateTags.save).toBeArrayOfSize(0);

    // Check to ensure data has not been mutated
    const getTagVars = { userId: '1', itemIds: ['1'] };
    const tagData = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(GET_TAGS_FOR_SAVE), variables: getTagVars });
    const expectedTags = [{ name: 'tobio' }, { name: 'shoyo' }];
    expect(
      tagData.body.data._entities[0].saveById[0].tags,
    ).toIncludeSameMembers(expectedTags);
  });
  it('skips adding tags that already exist', async () => {
    const variables = {
      userId: '1',
      input: [
        {
          saveId: '1',
          removeTagIds: [],
          addTagNames: ['tobio'],
        },
      ],
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expectedTags = [{ name: 'tobio' }, { name: 'shoyo' }];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toIncludeSameMembers(
      expectedTags,
    );
    const dbResult = await readDb('item_tags')
      .select('tag', 'time_added', 'time_updated')
      .where({ user_id: 1, item_id: 1 });
    const expected = [
      { tag: 'shoyo', time_added: date, time_updated: date },
      { tag: 'tobio', time_added: date, time_updated: date },
    ];
    expect(dbResult).toIncludeSameMembers(expected);
  });
  it('sets appropriate timestamps in db', async () => {
    const variables = {
      userId: '1',
      input: [
        {
          saveId: '1',
          removeTagIds: [],
          addTagNames: ['sugawara'],
        },
      ],
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    const expectedTags = [
      { name: 'tobio' },
      { name: 'shoyo' },
      { name: 'sugawara' },
    ];
    expect(res.body.data.errors).toBeUndefined();
    expect(res.body.data.saveBatchUpdateTags.save[0].tags).toIncludeSameMembers(
      expectedTags,
    );
    const dbResult = await readDb('item_tags')
      .select('tag', 'time_added', 'time_updated')
      .where({ user_id: 1, item_id: 1 });
    const expected = [
      { tag: 'shoyo', time_added: date, time_updated: date },
      { tag: 'tobio', time_added: date, time_updated: date },
      {
        tag: 'sugawara',
        time_added: new Date('2023-02-23T20:23:00.000Z'),
        time_updated: new Date('2023-02-23T20:23:00.000Z'),
      },
    ];
    expect(dbResult).toIncludeSameMembers(expected);
  });
  it('throws a UserInput error if attempting to write more than 150 changes', async () => {
    const input = Array.from(Array(6).keys()).map((i) => {
      return {
        saveId: '1',
        removeTagIds: [],
        addTagNames: Array.from(Array(30).keys()).map(
          (j) => `dalmation_${i * 30 + j}`,
        ),
      };
    });
    // Toss a delete in there just to be sure to cover
    input[0].removeTagIds = ['shoyo'];
    const variables = {
      userId: '1',
      input,
      timestamp: '2023-02-23T20:23:00.000Z',
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(BATCH_UPDATE_TAGS),
        variables,
      });
    expect(res.body.data).toBeNull();
    expect(res.body.errors).toBeArrayOfSize(1);
    expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    expect(res.body.errors[0].message).toStartWith(
      'Maximum number of operations exceeded (received=181, max=',
    );
  });
  it.todo('emits appropriate events');
});
