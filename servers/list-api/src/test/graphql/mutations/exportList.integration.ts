import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';

describe('exportList mutation', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const headers = {
    userid: '1',
    encodedid: 'abc123',
  };
  const exportListMutation = `
      mutation exportList {
        exportList
      }
    `;
  const eventMock = jest
    .spyOn(PocketEventBridgeClient.prototype, 'sendPocketEvent')
    .mockResolvedValue();

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  afterEach(() => jest.clearAllMocks());
  afterAll(async () => {
    jest.restoreAllMocks();
    await server.stop();
  });
  it('sends event to event bridge with expected payload', async () => {
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({ query: exportListMutation });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.exportList).toBeString();
    expect(eventMock).toHaveBeenCalledOnce();
    const eventPayload = eventMock.mock.calls[0][0];
    const eventDetail = eventPayload.detail;
    expect(eventPayload).toMatchObject({
      source: 'list-api',
      'detail-type': 'list-export-requested',
    });
    expect(eventDetail).toMatchObject({
      part: 0,
      cursor: -1,
      requestId: res.body.data.exportList,
      userId: '1',
      encodedId: 'abc123',
    });
  });
});
