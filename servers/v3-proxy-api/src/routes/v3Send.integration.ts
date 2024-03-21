import request from 'supertest';
import { startServer } from '../server';
import { Server } from 'http';
import { Application } from 'express';
import { ActionsRouter } from './ActionsRouter';
import { expectedAddResponses } from '../test/fixtures/add';
import { ClientError } from 'graphql-request';
import { GraphQLError } from 'graphql-request/build/esm/types';

describe('v3Get', () => {
  let app: Application;
  let server: Server;
  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('v3/send', () => {
    describe('validation', () => {
      it('Returns 400 if action array element name is not in allowlist', async () => {
        const response = await request(app)
          .post('/v3/send')
          .send({
            consumer_key: 'test',
            access_token: 'test',
            actions: [{ action: 'really_add', url: 'http://domain.com/path' }],
          });
        expect(response.status).toEqual(400);
      });
      it('Returns 400 if action array element fails validation', async () => {
        const response = await request(app)
          .post('/v3/send')
          .send({
            consumer_key: 'test',
            access_token: 'test',
            actions: [
              { action: 'add', url: 'http://domain.com/path' },
              { action: 'add', url: 'not a url' },
            ],
          });
        expect(response.status).toEqual(400);
      });
    });
    describe('actions', () => {
      beforeAll(() =>
        jest
          .spyOn(ActionsRouter.prototype, 'add')
          .mockResolvedValueOnce(expectedAddResponses[0])
          .mockRejectedValueOnce(
            new ClientError(
              {
                data: null,
                status: 403,
                errors: [
                  {
                    extensions: { code: 'FORBIDDEN' },
                  } as unknown as GraphQLError,
                ],
              },
              {} as any,
            ),
          ),
      );
      afterAll(() => jest.restoreAllMocks());
      it('sends an array of responses and errors', async () => {
        const response = await request(app)
          .post('/v3/send')
          .send({
            consumer_key: 'test',
            access_token: 'test',
            actions: [
              { action: 'add', url: 'http://domain.com/path' },
              { action: 'add', url: 'http://domain.com/another-path' },
            ],
          });
        const expected = {
          status: 1,
          action_results: [expectedAddResponses[0], false],
          action_errors: [
            null,
            { message: 'Something Went Wrong', type: 'Forbidden', code: 5200 },
          ],
        };
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(expected);
      });
    });
  });
});
