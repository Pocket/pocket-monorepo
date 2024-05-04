import request from 'supertest';
import { startServer } from '../server.js';
import { Server } from 'http';
import { Application } from 'express';
import { ActionsRouter } from './ActionsRouter.js';
import {
  expectedAddResponses,
  mockGraphAddResponses,
} from '../test/fixtures/add.js';
import { ClientError, GraphQLClient } from 'graphql-request';
import { GraphQLError } from 'graphql-request/build/esm/types.js';

describe('v3/send', () => {
  let app: Application;
  let server: Server;
  let clientSpy;

  const now = Math.round(Date.now() / 1000);
  const isoNow = new Date(now * 1000).toISOString();
  beforeAll(async () => {
    ({ app, server } = await startServer(0));
    // Response is unused so it doesn't matter what it returns
    clientSpy = jest
      .spyOn(GraphQLClient.prototype, 'request')
      .mockResolvedValue(true);
    jest.useFakeTimers({
      now: now * 1000,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
      advanceTimers: false,
    });
  });
  afterAll(async () => {
    clientSpy.mockRestore();
    server.close();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  afterEach(() => jest.clearAllMocks());

  describe('GET verb', () => {
    it('handles encoded actions array in GET request and returns expected response', async () => {
      const actions =
        '%5B%7B%22time%22%3A1712010135%2C%22action%22%3A%22opened_app%22%2C%22cxt_online%22%3A1%2C%22cxt_orient%22%3A1%2C%22cxt_theme%22%3A0%2C%22cxt_view%22%3A%22pocket%22%2C%22sid%22%3A%221712010135%22%7D%2C%7B%22event%22%3A%22open%22%2C%22section%22%3A%22options%22%2C%22time%22%3A1712010136%2C%22version%22%3A%221%22%2C%22view%22%3A%22options%22%2C%22action%22%3A%22pv%22%2C%22cxt_online%22%3A3%2C%22cxt_orient%22%3A1%2C%22cxt_theme%22%3A0%2C%22cxt_view%22%3A%22list%22%2C%22sid%22%3A%221712010135%22%7D%2C%7B%22time%22%3A1712016912%2C%22action%22%3A%22favorite%22%2C%22item_id%22%3A%22123345%22%2C%22cxt_view%22%3A%22pocket%22%2C%22sid%22%3A%221712010135%22%7D%5D';
      const response = await request(app).get('/v3/send').query({
        consumer_key: 'test',
        guid: 'test',
        access_token: 'test',
        locale_lang: 'en-US',
        actions,
      });
      const expected = {
        status: 1,
        action_results: [false, false, true],
        action_errors: [
          {
            message: "Invalid Action: 'opened_app'",
            type: 'Bad request',
            code: 130,
          },
          {
            message: "Invalid Action: 'pv'",
            type: 'Bad request',
            code: 130,
          },
          null,
        ],
      };
      expect(response.body).toEqual(expected);
    });
  });
  describe('POST verb', () => {
    it('handles encoded actions array in POST body and returns expected response', async () => {
      const actions =
        '%5B%7B%22time%22%3A1712010135%2C%22action%22%3A%22opened_app%22%2C%22cxt_online%22%3A1%2C%22cxt_orient%22%3A1%2C%22cxt_theme%22%3A0%2C%22cxt_view%22%3A%22pocket%22%2C%22sid%22%3A%221712010135%22%7D%2C%7B%22event%22%3A%22open%22%2C%22section%22%3A%22options%22%2C%22time%22%3A1712010136%2C%22version%22%3A%221%22%2C%22view%22%3A%22options%22%2C%22action%22%3A%22pv%22%2C%22cxt_online%22%3A3%2C%22cxt_orient%22%3A1%2C%22cxt_theme%22%3A0%2C%22cxt_view%22%3A%22list%22%2C%22sid%22%3A%221712010135%22%7D%2C%7B%22time%22%3A1712016912%2C%22action%22%3A%22favorite%22%2C%22item_id%22%3A%22123345%22%2C%22cxt_view%22%3A%22pocket%22%2C%22sid%22%3A%221712010135%22%7D%5D';
      const response = await request(app)
        .post('/v3/send')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          consumer_key: 'test',
          guid: 'test',
          access_token: 'test',
          locale_lang: 'en-US',
          actions,
        });
      const expected = {
        status: 1,
        action_results: [false, false, true],
        action_errors: [
          {
            message: "Invalid Action: 'opened_app'",
            type: 'Bad request',
            code: 130,
          },
          {
            message: "Invalid Action: 'pv'",
            type: 'Bad request',
            code: 130,
          },
          null,
        ],
      };
      expect(response.body).toEqual(expected);
    });
  });
  describe('v3/send', () => {
    describe('validation', () => {
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
      describe('processActions', () => {
        let addSpy;
        beforeEach(
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
        afterEach(() => addSpy.mockRestore());
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
        it('returns false response with error for unimplemented action', async () => {
          const response = await request(app)
            .post('/v3/send')
            .send({
              consumer_key: 'test',
              access_token: 'test',
              actions: [
                { action: 'action_imposter', name: 'no, really' },
                { action: 'add', url: 'http://domain.com/path' },
                { action: 'not_an_action', data: 'whatever' },
              ],
            });
          const expected = {
            status: 1,
            action_results: [false, expectedAddResponses[0], false],
            action_errors: [
              {
                message: `Invalid Action: 'action_imposter'`,
                type: 'Bad request',
                code: 130,
              },
              null,
              {
                message: `Invalid Action: 'not_an_action'`,
                type: 'Bad request',
                code: 130,
              },
            ],
          };
          expect(response.status).toEqual(200);
          expect(response.body).toEqual(expected);
        });
      });
      describe('recent_search', () => {
        it.each([
          {
            input: {
              action: 'recent_search',
              search: 'tav',
            },
            expectedCall: {
              search: {
                term: 'tav',
                timestamp: isoNow,
              },
            },
          },
          {
            input: {
              action: 'recent_search',
              search: 'tav',
              time: '1711558016',
            },
            expectedCall: {
              search: {
                term: 'tav',
                timestamp: '2024-03-27T16:46:56.000Z',
              },
            },
          },
        ])(
          'conditionally adds timestamp and calls correct mutation',
          async ({ input, expectedCall }) => {
            const res = await request(app)
              .post('/v3/send')
              .send({
                consumer_key: 'test',
                access_token: 'test',
                actions: [input],
              });
            expect(clientSpy).toHaveBeenCalledTimes(1);
            expect(
              clientSpy.mock.calls[0][0].definitions[0].name.value,
            ).toEqual('SaveSearch');
            expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
            expect(res.body).toEqual({
              status: 1,
              action_results: [true],
              action_errors: [null],
            });
          },
        );
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
              timestamp: isoNow,
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
          'calls mutation by url if itemId is not present and returns true: $name',
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
              timestamp: isoNow,
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
      describe('single-item tag actions', () => {
        describe('tags_replace', () => {
          it.each([
            {
              input: {
                action: 'tags_replace',
                item_id: '12345',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { id: '12345' },
                timestamp: isoNow,
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_replace',
                url: 'http://test.com',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { url: 'http://test.com' },
                timestamp: isoNow,
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_replace',
                item_id: '12345',
                url: 'http://test.com',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { id: '12345', url: 'http://test.com' },
                timestamp: isoNow,
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_replace',
                item_id: '12345',
                time: '1711558016',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { id: '12345' },
                timestamp: '2024-03-27T16:46:56.000Z',
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_replace',
                url: 'http://test.com',
                time: '1711558016',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { url: 'http://test.com' },
                timestamp: '2024-03-27T16:46:56.000Z',
                tagNames: ['supplemental'],
              },
            },
          ])(
            'conditionally adds id or url, and timestamp',
            async ({ input, expectedCall }) => {
              const res = await request(app)
                .post('/v3/send')
                .send({
                  consumer_key: 'test',
                  access_token: 'test',
                  actions: [input],
                });
              expect(clientSpy).toHaveBeenCalledTimes(1);
              expect(
                clientSpy.mock.calls[0][0].definitions[0].name.value,
              ).toEqual('ReplaceTags');
              expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
              expect(res.body).toEqual({
                status: 1,
                action_results: [true],
                action_errors: [null],
              });
            },
          );
        });
        describe('tags_remove', () => {
          it.each([
            {
              input: {
                action: 'tags_remove',
                item_id: '12345',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { id: '12345' },
                timestamp: isoNow,
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_remove',
                url: 'http://test.com',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { url: 'http://test.com' },
                timestamp: isoNow,
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_remove',
                item_id: '12345',
                url: 'http://test.com',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { id: '12345', url: 'http://test.com' },
                timestamp: isoNow,
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_remove',
                item_id: '12345',
                time: '1711558016',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { id: '12345' },
                timestamp: '2024-03-27T16:46:56.000Z',
                tagNames: ['supplemental'],
              },
            },
            {
              input: {
                action: 'tags_remove',
                url: 'http://test.com',
                time: '1711558016',
                tags: 'supplemental',
              },
              expectedCall: {
                savedItem: { url: 'http://test.com' },
                timestamp: '2024-03-27T16:46:56.000Z',
                tagNames: ['supplemental'],
              },
            },
          ])(
            'conditionally adds id or url, and timestamp',
            async ({ input, expectedCall }) => {
              const res = await request(app)
                .post('/v3/send')
                .send({
                  consumer_key: 'test',
                  access_token: 'test',
                  actions: [input],
                });
              expect(clientSpy).toHaveBeenCalledTimes(1);
              expect(
                clientSpy.mock.calls[0][0].definitions[0].name.value,
              ).toEqual('RemoveTags');
              expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
              expect(res.body).toEqual({
                status: 1,
                action_results: [true],
                action_errors: [null],
              });
            },
          );
        });
        describe('tags_clear', () => {
          it.each([
            {
              input: { action: 'tags_clear', item_id: '12345' },
              expectedCall: { savedItem: { id: '12345' }, timestamp: isoNow },
            },
            {
              input: { action: 'tags_clear', url: 'http://test.com' },
              expectedCall: {
                savedItem: { url: 'http://test.com' },
                timestamp: isoNow,
              },
            },
            {
              input: {
                action: 'tags_clear',
                item_id: '12345',
                url: 'http://test.com',
              },
              expectedCall: {
                savedItem: { id: '12345', url: 'http://test.com' },
                timestamp: isoNow,
              },
            },
            {
              input: {
                action: 'tags_clear',
                item_id: '12345',
                time: '1711558016',
              },
              expectedCall: {
                savedItem: { id: '12345' },
                timestamp: '2024-03-27T16:46:56.000Z',
              },
            },
            {
              input: {
                action: 'tags_clear',
                url: 'http://test.com',
                time: '1711558016',
              },
              expectedCall: {
                savedItem: { url: 'http://test.com' },
                timestamp: '2024-03-27T16:46:56.000Z',
              },
            },
          ])(
            'conditionally adds id or url, and timestamp',
            async ({ input, expectedCall }) => {
              const res = await request(app)
                .post('/v3/send')
                .send({
                  consumer_key: 'test',
                  access_token: 'test',
                  actions: [input],
                });
              expect(clientSpy).toHaveBeenCalledTimes(1);
              expect(
                clientSpy.mock.calls[0][0].definitions[0].name.value,
              ).toEqual('ClearTags');
              expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
              expect(res.body).toEqual({
                status: 1,
                action_results: [true],
                action_errors: [null],
              });
            },
          );
        });
        describe('tags_add', () => {
          it.each([
            {
              input: {
                action: 'tags_add',
                item_id: '12345',
                tags: 'perilous,decisive-only',
              },
              expectedCall: {
                input: [
                  {
                    savedItemId: '12345',
                    tags: ['perilous', 'decisive-only'],
                  },
                ],
                timestamp: isoNow,
              },
              mutationName: 'AddTagsById',
            },
            {
              input: {
                action: 'tags_add',
                url: 'http://test.com',
                tags: 'perilous,decisive-only',
              },
              expectedCall: {
                input: {
                  givenUrl: 'http://test.com',
                  tagNames: ['perilous', 'decisive-only'],
                },
                timestamp: isoNow,
              },
              mutationName: 'AddTagsByUrl',
            },
            {
              input: {
                action: 'tags_add',
                item_id: '12345',
                url: 'http://test.com',
                tags: 'perilous,decisive-only',
              },
              expectedCall: {
                input: [
                  {
                    savedItemId: '12345',
                    tags: ['perilous', 'decisive-only'],
                  },
                ],
                timestamp: isoNow,
              },
              mutationName: 'AddTagsById',
            },
            {
              input: {
                action: 'tags_add',
                item_id: '12345',
                time: '1711558016',
                tags: 'perilous,decisive-only',
              },
              expectedCall: {
                input: [
                  {
                    savedItemId: '12345',
                    tags: ['perilous', 'decisive-only'],
                  },
                ],
                timestamp: '2024-03-27T16:46:56.000Z',
              },
              mutationName: 'AddTagsById',
            },
            {
              input: {
                action: 'tags_add',
                url: 'http://test.com',
                time: '1711558016',
                tags: 'perilous',
              },
              expectedCall: {
                input: { givenUrl: 'http://test.com', tagNames: ['perilous'] },
                timestamp: '2024-03-27T16:46:56.000Z',
              },
              mutationName: 'AddTagsByUrl',
            },
          ])(
            'conditionally adds id or url, timestamp, and routes to correct mutation',
            async ({ input, expectedCall, mutationName }) => {
              const res = await request(app)
                .post('/v3/send')
                .send({
                  consumer_key: 'test',
                  access_token: 'test',
                  actions: [input],
                });
              expect(clientSpy).toHaveBeenCalledTimes(1);
              expect(
                clientSpy.mock.calls[0][0].definitions[0].name.value,
              ).toEqual(mutationName);
              expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
              expect(res.body).toEqual({
                status: 1,
                action_results: [true],
                action_errors: [null],
              });
            },
          );
        });
        describe('readd', () => {
          it.each([
            {
              input: {
                action: 'readd',
                url: 'http://domain.com',
              },
              expectedCall: {
                input: { url: 'http://domain.com', timestamp: now },
              },
              mutationName: 'addSavedItemComplete',
              property: 'upsertSavedItem',
            },
            {
              input: {
                action: 'readd',
                url: 'http://test.com',
                time: '1711558016',
              },
              expectedCall: {
                input: {
                  url: 'http://test.com',
                  timestamp: 1711558016,
                },
              },
              mutationName: 'addSavedItemComplete',
              property: 'upsertSavedItem',
            },
            {
              input: {
                action: 'readd',
                item_id: '12345',
                url: 'http://test.com',
              },
              expectedCall: {
                id: '12345',
                timestamp: isoNow,
              },
              mutationName: 'ReAddById',
              property: 'reAddById',
            },
            {
              input: {
                action: 'readd',
                item_id: '12345',
              },
              expectedCall: {
                id: '12345',
                timestamp: isoNow,
              },
              mutationName: 'ReAddById',
              property: 'reAddById',
            },
            {
              input: {
                action: 'readd',
                item_id: '12345',
                time: '1711558016',
              },
              expectedCall: {
                id: '12345',
                timestamp: '2024-03-27T16:46:56.000Z',
              },
              mutationName: 'ReAddById',
              property: 'reAddById',
            },
          ])(
            'conditionally adds id or url, timestamp, and routes to correct mutation',
            async ({ input, expectedCall, mutationName, property }) => {
              // This one actually uses the response
              clientSpy.mockRestore();
              clientSpy = jest
                .spyOn(GraphQLClient.prototype, 'request')
                .mockResolvedValue({ [property]: mockGraphAddResponses[0] });
              const res = await request(app)
                .post('/v3/send')
                .send({
                  consumer_key: 'test',
                  access_token: 'test',
                  actions: [input],
                });
              expect(clientSpy).toHaveBeenCalledTimes(1);
              expect(
                clientSpy.mock.calls[0][0].definitions[0].name.value,
              ).toEqual(mutationName);
              expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
              expect(res.body).toEqual({
                status: 1,
                action_results: [expectedAddResponses[0]],
                action_errors: [null],
              });
            },
          );
        });
      });
      describe('multi-item tag action', () => {
        describe('tag_rename', () => {
          it.each([
            {
              input: { action: 'tag_rename', old_tag: 'tav', new_tag: 'rue' },
              expectedCall: {
                oldName: 'tav',
                newName: 'rue',
                timestamp: isoNow,
              },
            },
            {
              input: {
                action: 'tag_rename',
                old_tag: 'tav',
                new_tag: 'rue',
                time: '1711558016',
              },
              expectedCall: {
                oldName: 'tav',
                newName: 'rue',
                timestamp: '2024-03-27T16:46:56.000Z',
              },
            },
          ])(
            'conditionally adds timestamp and calls correct mutation',
            async ({ input, expectedCall }) => {
              const res = await request(app)
                .post('/v3/send')
                .send({
                  consumer_key: 'test',
                  access_token: 'test',
                  actions: [input],
                });
              expect(clientSpy).toHaveBeenCalledTimes(1);
              expect(
                clientSpy.mock.calls[0][0].definitions[0].name.value,
              ).toEqual('RenameTag');
              expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
              expect(res.body).toEqual({
                status: 1,
                action_results: [true],
                action_errors: [null],
              });
            },
          );
        });
        describe('tag_delete', () => {
          it.each([
            {
              input: {
                action: 'tag_delete',
                tag: 'tav',
              },
              expectedCall: {
                tagName: 'tav',
                timestamp: isoNow,
              },
            },
            {
              input: {
                action: 'tag_delete',
                tag: 'tav',
                time: '1711558016',
              },
              expectedCall: {
                tagName: 'tav',
                timestamp: '2024-03-27T16:46:56.000Z',
              },
            },
          ])(
            'conditionally adds timestamp and calls correct mutation',
            async ({ input, expectedCall }) => {
              const res = await request(app)
                .post('/v3/send')
                .send({
                  consumer_key: 'test',
                  access_token: 'test',
                  actions: [input],
                });
              expect(clientSpy).toHaveBeenCalledTimes(1);
              expect(
                clientSpy.mock.calls[0][0].definitions[0].name.value,
              ).toEqual('DeleteTag');
              expect(clientSpy.mock.calls[0][1]).toEqual(expectedCall);
              expect(res.body).toEqual({
                status: 1,
                action_results: [true],
                action_errors: [null],
              });
            },
          );
        });
      });
    });
  });
});
