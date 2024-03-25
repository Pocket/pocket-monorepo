import { readClient, writeClient } from '../../../database/client';
import { EventType } from '../../../businessEvents';
import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';

describe('clearTags mutation', () => {
  //using write client as mutation will use write client to read as well.
  const writeDb = writeClient();
  const readDb = readClient();
  const eventSpy = jest.spyOn(ContextManager.prototype, 'emitItemEvent');
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const headers = {
    userid: '1',
  };

  const clearTagsMutation = `
      mutation clearTags($saveRef: SavedItemRef!, $timestamp: ISOString) {
        clearTags(id: $saveRef, timestamp: $timestamp) {
          id
          url
          tags {
            name
          }
          _updatedAt
        }
      }
    `;

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  afterAll(async () => {
    await writeDb.destroy();
    await readDb.destroy();
    jest.restoreAllMocks();
    await server.stop();
  });
  it('clears tags associated to a SavedItem, referenced by ID', () => {});
  it('clears tags associated to a SavedItem, referenced by name', () => {});
  it('throws bad user input error if neither ID nor Url are passed', async () => {
    const variables = { saveRef: {} };
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: clearTagsMutation, variables });
    console.log(JSON.stringify(res));
  });
  it('does not throw error for a SavedItem with no tags', () => {});
  it('throws error if SavedItem does not exist', () => {});
});
