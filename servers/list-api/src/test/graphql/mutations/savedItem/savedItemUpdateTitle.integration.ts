import { readClient, writeClient } from '../../../../database/client';
import { ContextManager } from '../../../../server/context';
import { startServer } from '../../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { print } from 'graphql';
import request from 'supertest';
import { mockParserGetItemIdRequest } from '../../../utils/parserMocks';

describe('savedItemArchive mutation', function () {
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  const headers = { userid: '1' };
  const date = new Date('2020-10-03T10:20:30.000Z'); // Consistent date for seeding
  const date1 = new Date('2020-10-03T10:30:30.000Z'); // Consistent date for seeding
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;

  const UPDATE_TITLE_MUTATION = gql`
    mutation savedItemUpdateTitle(
      $givenUrl: Url!
      $timestamp: ISOString!
      $title: String!
    ) {
      savedItemUpdateTitle(
        givenUrl: $givenUrl
        timestamp: $timestamp
        title: $title
      ) {
        id
        title
        url
        _updatedAt
      }
    }
  `;

  const UPDATE_TITLE_MUTATION_BY_ID = gql`
    mutation updateSavedItemTitle(
      $id: ID!
      $timestamp: ISOString!
      $title: String!
    ) {
      updateSavedItemTitle(id: $id, timestamp: $timestamp, title: $title) {
        id
        title
        url
        _updatedAt
      }
    }
  `;

  beforeEach(async () => {
    await writeDb('list').truncate();
    const inputData = [
      { item_id: 0, status: 0, favorite: 0 },
      { item_id: 1, status: 0, favorite: 0 },
      // One that's already archived
      { item_id: 2, status: 1, favorite: 0 },
    ].map((row) => {
      return {
        ...row,
        user_id: 1,
        resolved_id: row.item_id,
        given_url: `http://${row.item_id}`,
        title: `title ${row.item_id}`,
        time_added: date,
        time_updated: date1,
        time_read: row.status === 1 ? date : '0000-00-00 00:00:00',
        time_favorited: date,
        api_id: 'apiid',
        api_id_updated: 'apiid',
      };
    });
    await writeDb('list').insert(inputData);
  });

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });

  afterAll(async () => {
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
  });

  afterEach(() => jest.clearAllMocks());

  it('updates the title of a saved item, by url', async () => {
    const givenUrl = 'http://1';
    mockParserGetItemIdRequest(givenUrl, '1');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const testEpoch = new Date(testTimestamp).getTime() / 1000;
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
      title: "Baldur's Gate 3 is the best. Period.",
    };

    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UPDATE_TITLE_MUTATION), variables });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.savedItemUpdateTitle).toStrictEqual({
      id: '1',
      url: givenUrl,
      title: "Baldur's Gate 3 is the best. Period.",
      _updatedAt: testEpoch,
    });
  });
  it('updates the title of a saved item, by id', async () => {
    const givenUrl = 'http://1';
    const id = '1';
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const testEpoch = new Date(testTimestamp).getTime() / 1000;
    const variables = {
      id,
      timestamp: testTimestamp,
      title: "Baldur's Gate 3 Wins 2023 Game of the Year",
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UPDATE_TITLE_MUTATION_BY_ID), variables });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.updateSavedItemTitle).toStrictEqual({
      id,
      url: givenUrl,
      title: "Baldur's Gate 3 Wins 2023 Game of the Year",
      _updatedAt: testEpoch,
    });
  });
  it('throws NotFound error if the savedItem does not have an itemId', async () => {
    const givenUrl = 'http://999';
    mockParserGetItemIdRequest(givenUrl, null);
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
      title: "Why you need to replay Baldur's Gate 3",
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UPDATE_TITLE_MUTATION), variables });
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        extensions: { code: 'NOT_FOUND' },
        message: expect.stringContaining('SavedItem does not exist'),
      }),
    );
  });
  it('should not emit a title change event if the savedItem did not have an itemId', async () => {
    const givenUrl = 'http://999';
    mockParserGetItemIdRequest(givenUrl, null);
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
      title: "I did an evil playthrough of Baldur's Gate 3 and I'm not sorry",
    };
    await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UPDATE_TITLE_MUTATION), variables });
    expect(eventSpy).toHaveBeenCalledTimes(0);
  });
  it('throws NotFound error and does not emit event if the savedItem is not in the user saves', async () => {
    const givenUrl = 'http://999';
    mockParserGetItemIdRequest(givenUrl, '999');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
      title: "Why playing the good guy is more rewarding in Baldur's Gate 3",
    };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UPDATE_TITLE_MUTATION), variables });
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({
        extensions: { code: 'NOT_FOUND' },
        message: expect.stringContaining('SavedItem does not exist'),
      }),
    );
    expect(eventSpy).toHaveBeenCalledTimes(0);
  });
  it('should emit a title update event when a savedItem title is updated', async () => {
    const givenUrl = 'http://1';
    mockParserGetItemIdRequest(givenUrl, '1');
    const testTimestamp = '2023-10-05T14:48:00.000Z';
    const variables = {
      givenUrl,
      timestamp: testTimestamp,
      title: "Baldur's Gate 3 companion story arcs, ranked",
    };
    await request(app)
      .post(url)
      .set(headers)
      .send({ query: print(UPDATE_TITLE_MUTATION), variables });
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0]).toStrictEqual([
      'UPDATE_TITLE',
      expect.objectContaining({
        url: givenUrl,
        time_updated: new Date(testTimestamp),
      }),
    ]);
  });
});
