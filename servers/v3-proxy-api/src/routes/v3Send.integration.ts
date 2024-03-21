import request from 'supertest';
import { startServer } from '../server';
import { Server } from 'http';
import { Application } from 'express';
import { ActionsRouter } from './ActionsRouter';
import { expectedAddResponses } from '../test/fixtures/add';
import { ClientError, GraphQLClient } from 'graphql-request';
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
  afterAll(() => jest.restoreAllMocks());

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
    describe('actions router', () => {
      let clientSpy;
      beforeAll(
        () =>
          // Response is unused so it doesn't matter what it returns
          (clientSpy = jest
            .spyOn(GraphQLClient.prototype, 'request')
            .mockResolvedValue(true)),
      );
      afterEach(() => jest.clearAllMocks());
      afterAll(() => clientSpy.mockRestore());
      describe('processActions', () => {
        let addSpy;
        beforeAll(
          () =>
            (addSpy = jest
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
              )
              .mockResolvedValueOnce(expectedAddResponses[1])),
        );
        afterAll(() => addSpy.mockRestore());
        it('sends an array of responses and errors', async () => {
          const response = await request(app)
            .post('/v3/send')
            .send({
              consumer_key: 'test',
              access_token: 'test',
              actions: [
                { action: 'add', url: 'http://domain.com/path' },
                { action: 'add', url: 'http://domain.com/another-path' },
                { action: 'add', url: 'http://domain.com/does-not-matter' },
              ],
            });
          const expected = {
            status: 1,
            action_results: [
              expectedAddResponses[0],
              false,
              expectedAddResponses[1],
            ],
            action_errors: [
              null,
              {
                message: 'Something Went Wrong',
                type: 'Forbidden',
                code: 5200,
              },
              null,
            ],
          };
          expect(response.status).toEqual(200);
          expect(response.body).toEqual(expected);
        });
      });
      describe('save property actions', () => {
        it.each([
          { name: 'archive', property: 'updateSavedItemArchiveId' },
          { name: 'favorite', property: 'updateSavedItemFavoriteId' },
          { name: 'unfavorite', property: 'updateSavedItemUnFavoriteId' },
          { name: 'delete', property: 'id' },
        ])(
          'calls mutation by id if itemId is present and returns true: $name',
          async ({ name, property }) => {
            const res = await request(app)
              .post('/v3/send')
              .send({
                consumer_key: 'test',
                access_token: 'test',
                actions: [{ action: name, item_id: '12345' }],
              });
            expect(clientSpy.mock.calls[0][1]).toEqual({
              [property]: '12345',
            });
            expect(res.body).toEqual({
              status: 1,
              action_results: [true],
              action_errors: [null],
            });
          },
        );
        it.each([
          { name: 'archive' },
          { name: 'favorite' },
          { name: 'unfavorite' },
          { name: 'delete' },
        ])(
          'calls mutation by url if itemId is not present (optional timestamp) and returns true: $name',
          async ({ name }) => {
            const res = await request(app)
              .post('/v3/send')
              .send({
                consumer_key: 'test',
                access_token: 'test',
                actions: [
                  { action: name, url: 'http://domain.com' },
                  {
                    action: name,
                    url: 'http://domain2.com',
                    time: '1711044762',
                  },
                ],
              });
            expect(clientSpy.mock.calls[0][1]).toEqual({
              givenUrl: 'http://domain.com',
            });
            expect(clientSpy.mock.calls[1][1]).toEqual({
              givenUrl: 'http://domain2.com',
              timestamp: '2024-03-21T18:12:42.000Z',
            });
            expect(res.body).toEqual({
              status: 1,
              action_errors: [null, null],
              action_results: [true, true],
            });
          },
        );
      });
    });
  });
});
