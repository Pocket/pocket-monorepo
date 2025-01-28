import request from 'supertest';
import { startServer } from '../server';
import { Server } from 'http';
import { Application } from 'express';
import { GraphQLClient } from 'graphql-request';

describe('v3/send_guid', () => {
  let app: Application;
  let server: Server;
  let clientSpy;

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
    // Response is unused so it doesn't matter what it returns
    clientSpy = jest
      .spyOn(GraphQLClient.prototype, 'request')
      .mockResolvedValue(true);
  });
  afterAll(async () => {
    clientSpy.mockRestore();
    server.close();
    jest.restoreAllMocks();
  });
  afterEach(() => jest.clearAllMocks());

  it('Accepts actions without access token on POST', async () => {
    const actions =
      '%5B%7B%22action_identifier%22%3A%22referrer%22%2C%22page%22%3A%22installation%22%2C%22page_params%22%3A%22utm_source%3Dgoogle-play%26utm_medium%3Dorganic%22%2C%22section%22%3A%22core%22%2C%22time%22%3A1737985217%2C%22type_id%22%3A3%2C%22view%22%3A%22mobile%22%2C%22action%22%3A%22pv_wt%22%2C%22cxt_online%22%3A2%2C%22cxt_orient%22%3A1%2C%22sid%22%3A%221737985217%22%7D%5D';
    const response = await request(app).post('/v3/send_guid').send({
      consumer_key: 'test',
      guid: 'test',
      locale_lang: 'en-US',
      actions,
    });
    const expected = {
      status: 1,
      action_results: [false],
      action_errors: [
        {
          message: "Invalid Action: 'pv_wt'",
          type: 'Bad request',
          code: 130,
        },
      ],
    };
    expect(response.body).toEqual(expected);
  });
});
