import request from 'supertest';
import { startServer } from '../server';
import { Server } from 'http';
import { Application } from 'express';
import { ActionsRouter } from './ActionsRouter';
import {
  expectedAddResponses,
  mockGraphAddResponses,
} from '../test/fixtures/add';
import { ClientError, GraphQLClient } from 'graphql-request';
import { GraphQLError } from 'graphql-request/build/esm/types';

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
    it('handles GET requests with json-stringified query params already decoded by urlencoded middleware', async () => {
      const actions =
        '%5B%7B%22tags%22%3A%5B%22%21%40%23%24%25%26%22%5D%2C%22time%22%3A1714995462%2C%22url%22%3A%22https%3A%2F%2Fwww.independent.co.uk%2Flife-style%2Ffood-and-drink%2Ffeatures%2Fpizza-sauce-american-italian-food-b2534835.html%22%2C%22action%22%3A%22tags_replace%22%2C%22cxt_enter_cnt%22%3A0%2C%22cxt_online%22%3A2%2C%22cxt_orient%22%3A1%2C%22cxt_remove_cnt%22%3A0%2C%22cxt_suggested_available%22%3A0%2C%22cxt_suggested_cnt%22%3A0%2C%22cxt_tags_cnt%22%3A0%2C%22cxt_tap_cnt%22%3A1%2C%22cxt_theme%22%3A0%2C%22cxt_ui%22%3Anull%2C%22cxt_view%22%3A%22add_tags%22%2C%22sid%22%3A%221714834421%22%7D%5D';
      const response = await request(app).get(
        `/v3/send?consumer_key=test&guid=test&access_token=test&locale_lang=en-US&actions=${actions}`,
      );
      const expected = {
        status: 1,
        action_results: [true],
        action_errors: [null],
      };
      expect(response.body).toEqual(expected);
    });
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
      it('returns 400 if proper identifiers are not included', async () => {
        const response = await request(app)
          .post('/v3/send')
          .send({
            consumer_key: 'test',
            access_token: 'test',
            actions: [
              { action: 'favorite' },
              { action: 'favorite', item_id: 12345 },
            ],
          });
        expect(response.status).toEqual(400);
      });
    });
    describe('actions router', () => {
      it('throws Unimplemented Action error for adding by item_id alone', async () => {
        const response = await request(app)
          .post('/v3/send')
          .send({
            consumer_key: 'test',
            access_token: 'test',
            actions: [{ action: 'add', item_id: '12345' }],
          });
        const expected = {
          status: 1,
          action_results: [false],
          action_errors: [
            {
              message: `Invalid Action: 'add (item_id only)'`,
              type: 'Bad request',
              code: 130,
            },
          ],
        };
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(expected);
      });
      describe('processActions - unknown ClientError', () => {
        let addSpy;
        beforeEach(
          () =>
            (addSpy = jest
              .spyOn(ActionsRouter.prototype, 'add')
              .mockRejectedValueOnce(
                new ClientError(
                  {
                    data: null,
                    status: 403,
                    errors: [
                      {
                        extensions: { code: 'SOMETHING_ELSE' },
                      } as unknown as GraphQLError,
                    ],
                  },
                  {} as any,
                ),
              )),
        );
        afterEach(() => addSpy.mockRestore());
        it('defaults to internal server error if error code has no mapping', async () => {
          const response = await request(app)
            .post('/v3/send')
            .send({
              consumer_key: 'test',
              access_token: 'test',
              actions: [{ action: 'add', url: 'http://domain.com/path' }],
            });
          const expected = {
            status: 1,
            action_results: [false],
            action_errors: [
              {
                message: 'Something Went Wrong',
                type: 'Internal Server Error',
                code: 198,
              },
            ],
          };
          expect(response.status).toEqual(200);
          expect(response.body).toEqual(expected);
        });
      });
      describe('processActions - unknown error', () => {
        let addSpy;
        beforeEach(
          () =>
            (addSpy = jest
              .spyOn(ActionsRouter.prototype, 'add')
              .mockRejectedValueOnce(new Error('random runtime error'))),
        );
        afterEach(() => addSpy.mockRestore());
        it('defaults to internal server error if run into a non-graph-client error', async () => {
          const response = await request(app)
            .post('/v3/send')
            .send({
              consumer_key: 'test',
              access_token: 'test',
              actions: [{ action: 'add', url: 'http://domain.com/path' }],
            });
          const expected = {
            status: 1,
            action_results: [false],
            action_errors: [
              {
                message: 'Something Went Wrong',
                type: 'Internal Server Error',
                code: 198,
              },
            ],
          };
          expect(response.status).toEqual(200);
          expect(response.body).toEqual(expected);
        });
      });
      describe('processActions', () => {
        let addSpy;
        beforeEach(
          () =>
            (addSpy = jest
              .spyOn(ActionsRouter.prototype, 'add')
              .mockResolvedValueOnce(expectedAddResponses[0]['item'])
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
              .mockResolvedValueOnce(expectedAddResponses[1]['item'])),
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
              expectedAddResponses[0]['item'],
              false,
              expectedAddResponses[1]['item'],
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
            action_results: [false, expectedAddResponses[0]['item'], false],
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
      describe('actions which affect a single item (but not its direct properties)', () => {
        describe('add_annotation', () => {
          const annotation = {
            annotation_id: '79fb7c74-1c1c-429d-b4f9-1381b5c9b72f',
            patch:
              '@@ -997,16 +997,36 @@\n n fact, \n+%3Cpkt_tag_annotation%3E\n Kraft Si\n@@ -1130,16 +1130,37 @@\n e food,%E2%80%9D\n+%3C/pkt_tag_annotation%3E\n  due to \n',
            quote:
              'Kraft Singles, the standard for American cheese, cannot legally be called American cheese, or even “cheese food,”',
            version: 2,
          };
          const expectedAnnotation = {
            id: annotation.annotation_id,
            patch: annotation.patch,
            quote: annotation.quote,
            version: annotation.version,
          };
          it.each([
            {
              input: {
                action: 'add_annotation',
                annotation,
                time: 1711044762,
                url: 'https://www.eater.com/23734992/new-school-cheese-artisanal-american-cheese',
              },
              mutationName: 'AddAnnotationByUrl',
              expectedCall: {
                input: {
                  ...expectedAnnotation,
                  url: 'https://www.eater.com/23734992/new-school-cheese-artisanal-american-cheese',
                },
              },
            },
            {
              input: {
                action: 'add_annotation',
                annotation,
                time: 1711044762,
                item_id: '12345',
              },
              mutationName: 'AddAnnotationByItemId',
              expectedCall: {
                input: [{ ...expectedAnnotation, itemId: '12345' }],
              },
            },
          ])(
            'adds an annotation',
            async ({ input, mutationName, expectedCall }) => {
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
        describe('delete_annotation', () => {
          it('deletes an annotation', async () => {
            const input = {
              action: 'delete_annotation',
              time: 1711044762,
              annotation_id: 'abc-123-def',
            };
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
            ).toEqual('DeleteAnnotation');
            expect(clientSpy.mock.calls[0][1]).toEqual({ id: 'abc-123-def' });
            expect(res.body).toEqual({
              status: 1,
              action_results: [true],
              action_errors: [null],
            });
          });
        });
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
          it.each(['', []])(
            'makes a tags_clear request if tags_replace array is empty',
            async (tags) => {
              const input = {
                action: 'tags_replace',
                url: 'http://test.com',
                time: '1711558016',
                tags,
              };
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
              expect(clientSpy.mock.calls[0][1]).toEqual({
                savedItem: { url: 'http://test.com' },
                timestamp: '2024-03-27T16:46:56.000Z',
              });
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
                action_results: [expectedAddResponses[0]['item']],
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
