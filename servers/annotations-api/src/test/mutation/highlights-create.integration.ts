import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../server/apollo/context';
import { readClient, writeClient } from '../../database/client';
import { seedData } from '../query/highlights-fixtures';
import {
  CREATE_HIGHLIGHT_BY_URL,
  CREATE_HIGHLIGHTS,
  CREATE_HIGHLIGHTS_WITH_NOTE,
} from './highlights-mutations';
import {
  CreateHighlightByUrlInput,
  CreateHighlightInput,
} from '../../__generated__/resolvers-types';
import { UsersMeta } from '../../dataservices/usersMeta';
import { mysqlTimeString } from '../../dataservices/utils';
import config from '../../config';
import { v4 as uuid } from 'uuid';
import { Application } from 'express';
import nock from 'nock';
import { HighlightsModel } from '../../models/HighlightsModel';

describe('Highlights creation', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  // Variables/data
  const baseHeaders = { userId: '1', premium: 'false' };
  const writeDb = writeClient();
  const readDb = readClient();
  const now = new Date();
  const testData = seedData(now);
  const truncateAndSeed = async () => {
    await Promise.all(
      Object.keys(testData).map((table) => writeDb(table).truncate()),
    );
    await Promise.all(
      Object.entries(testData).map(([table, data]) =>
        writeDb(table).insert(data),
      ),
    );
  };
  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });
  afterAll(async () => {
    await server.stop();
    await writeDb.destroy();
    await readDb.destroy();
  });

  beforeEach(async () => {
    await truncateAndSeed();
  });

  afterEach(async () => {
    jest.useRealTimers();
  });

  describe('any user', () => {
    const headers = baseHeaders;
    it('should create a highlight on a SavedItem without any existing highlights', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      const result = res.body.data?.createSavedItemHighlights;

      // Check the whole object and its fields
      const expectedHighlight = {
        version: 2,
        patch: 'Prow scuttle parrel',
        quote: 'provost Sail ho shrouds spirits boom',
      };
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(expect.objectContaining(expectedHighlight));
      // Check properties we don't know ahead of time
      expect(typeof result[0].id).toBe('string');
      expect(result[0].id).toBeTruthy();
      // CreatedAt and updatedAt are set on the DB server so difficult to mock
      expect(typeof result[0]._createdAt).toBe('number');
      expect(typeof result[0]._updatedAt).toBe('number');
      expect(result[0]._createdAt).toBeTruthy();
      expect(result[0]._updatedAt).toBeTruthy();
    });
    it('should optionally accept a UUID passed from the client and use for the ID', async () => {
      const id = uuid();
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            id,
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      const result = res.body.data?.createSavedItemHighlights;

      // Check the whole object and its fields
      const expectedHighlight = {
        id,
        version: 2,
        patch: 'Prow scuttle parrel',
        quote: 'provost Sail ho shrouds spirits boom',
      };
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(expect.objectContaining(expectedHighlight));
    });
    it('does not accept input with non-uuid ID strings', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            id: 'abc-234',
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      const result = res.body.errors;
      expect(result.length).toBe(1);
      expect(result[0].extensions.code).toBe('BAD_USER_INPUT');
    });
    it('should not overrwrite an existing highlight', async () => {
      const seed = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(CREATE_HIGHLIGHTS),
          variables: {
            input: [
              {
                id: uuid(),
                itemId: '1',
                version: 2,
                patch: 'Prow scuttle parrel',
                quote: 'provost Sail ho shrouds spirits boom',
              },
            ],
          },
        });
      const seedResult = seed.body.data?.createSavedItemHighlights;
      expect(seedResult.length).toEqual(1);
      const id = seedResult[0].id;
      const variables = {
        input: [
          {
            id,
            itemId: '1',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'Bring a spring upon her cable holystone',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      const result = res.body.errors;
      expect(result.length).toBe(1);
      expect(result[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
    });
    it('should create a highlight on a SavedItem with existing highlights', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '1',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      const result = res.body.data?.createSavedItemHighlights;

      expect(result.length).toEqual(1);
      expect(result[0].quote).toBe('provost Sail ho shrouds spirits boom');
    });

    it('should mark the list item as updated and log the highlight mutation', async () => {
      const updateDate = new Date(2022, 3, 3);
      jest.useFakeTimers({
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
      jest.setSystemTime(updateDate);

      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
        ],
      };
      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      const usersMetaRecord = await readDb('users_meta')
        .where({ user_id: '1', property: UsersMeta.propertiesMap.account })
        .pluck('value');

      const listRecord = await readDb('list')
        .where({ user_id: '1', item_id: '3' })
        .pluck('time_updated');

      expect(mysqlTimeString(listRecord[0])).toEqual(
        mysqlTimeString(updateDate, config.database.tz),
      );
      expect(usersMetaRecord[0]).toEqual(
        mysqlTimeString(updateDate, config.database.tz),
      );
    });
  });
  describe('non-premium users', () => {
    const headers = baseHeaders;
    it('should not allow non-premium users to create more than three highlights at once', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
          {
            itemId: '3',
            version: 2,
            patch: 'hempen jig carouser',
            quote: 'Bring a spring upon her cable holystone',
          },
          {
            itemId: '3',
            version: 2,
            patch: 'Swab barque interloper',
            quote: 'chantey doubloon starboard grog black jack',
          },
          {
            itemId: '3',
            version: 2,
            patch: 'Trysail Sail ho',
            quote: 'Corsair red ensign hulk smartly boom jib rum',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      expect(res.body.errors).not.toBeUndefined();
      expect(res.body.errors.length).toEqual(1);
      expect(res.body.errors[0].extensions?.code).toEqual('BAD_USER_INPUT');
      expect(res.body.errors[0].message).toContain('Too many highlights');
    });
    it('should not allow non-premium users to create additional highlights on a SavedItem that already has highlights, if it would put them over the three-highlight limit', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '2',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
          {
            itemId: '2',
            version: 2,
            patch: 'hempen jig carouser',
            quote: 'Bring a spring upon her cable holystone',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      expect(res.body.errors).not.toBeUndefined();
      expect(res.body.errors.length).toEqual(1);
      expect(res.body.errors[0].extensions?.code).toEqual('BAD_USER_INPUT');
      expect(res.body.errors[0].message).toContain('Too many highlights');
    });
    it('should not include deleted highlights in the limit', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '2',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data).toBeTruthy();
      expect(res.body.data?.createSavedItemHighlights.length).toEqual(1);
    });
  });
  describe('premium users', () => {
    const headers = { ...baseHeaders, premium: 'true' };
    it('should be able to create a note at the same time as a highlight', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
            note: 'This is the coolest of notes',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS_WITH_NOTE), variables });
      const result = res.body.data?.createSavedItemHighlights;

      // Check the whole object and its fields
      const expectedHighlight = {
        version: 2,
        patch: 'Prow scuttle parrel',
        quote: 'provost Sail ho shrouds spirits boom',
        note: {
          text: 'This is the coolest of notes',
        },
      };
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual(expect.objectContaining(expectedHighlight));
      // Check properties we don't know ahead of time
      expect(typeof result[0].id).toBe('string');
      expect(result[0].id).toBeTruthy();
      // CreatedAt and updatedAt are set on the DB server so difficult to mock
      expect(typeof result[0]._createdAt).toBe('number');
      expect(typeof result[0]._updatedAt).toBe('number');
      expect(result[0]._createdAt).toBeTruthy();
      expect(result[0]._updatedAt).toBeTruthy();
      expect(result[0].note?.text).toBe('This is the coolest of notes');
    });
    it('should create multiple highlights with and without notes', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
            note: 'This is the coolest of notes',
          },
          {
            itemId: '2',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
          {
            itemId: '2',
            version: 2,
            patch: 'Trysail Sail ho',
            quote: 'Corsair red ensign hulk smartly boom jib rum',
            note: 'An even cooler note???',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS_WITH_NOTE), variables });
      const result = res.body.data?.createSavedItemHighlights;

      expect(result.length).toEqual(3);
      expect(result[0].note?.text).toBe('This is the coolest of notes');
      expect(result[1].note).toBeNull();
      expect(result[2].note.text).toBe('An even cooler note???');
    });
    it('should not restrict the number of highlights a premium user can create at once', async () => {
      const variables: { input: CreateHighlightInput[] } = {
        input: [
          {
            itemId: '3',
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
          },
          {
            itemId: '3',
            version: 2,
            patch: 'hempen jig carouser',
            quote: 'Bring a spring upon her cable holystone',
          },
          {
            itemId: '3',
            version: 2,
            patch: 'Swab barque interloper',
            quote: 'chantey doubloon starboard grog black jack',
          },
          {
            itemId: '3',
            version: 2,
            patch: 'Trysail Sail ho',
            quote: 'Corsair red ensign hulk smartly boom jib rum',
          },
        ],
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(CREATE_HIGHLIGHTS), variables });
      const result = res.body.data?.createSavedItemHighlights;

      expect(result.length).toEqual(4);
      const expectedQuotes = variables.input.map((_) => _.quote);
      const actualQuotes = result.map((_) => _.quote);
      expect(actualQuotes).toEqual(expect.arrayContaining(expectedQuotes));
    });
    it(
      'should not restrict the number of highlights a premium user can add to a SavedItem' +
        'that already has highlights',
      async () => {
        const variables: { input: CreateHighlightInput[] } = {
          input: [
            {
              itemId: '2',
              version: 2,
              patch: 'Prow scuttle parrel',
              quote: 'provost Sail ho shrouds spirits boom',
            },
            {
              itemId: '2',
              version: 2,
              patch: 'hempen jig carouser',
              quote: 'Bring a spring upon her cable holystone',
            },
          ],
        };
        const res = await request(app)
          .post(graphQLUrl)
          .set(headers)
          .send({ query: print(CREATE_HIGHLIGHTS), variables });
        const result = res.body.data?.createSavedItemHighlights;

        expect(result.length).toEqual(2);
        const expectedQuotes = variables.input.map((_) => _.quote);
        const actualQuotes = result.map((_) => _.quote);
        expect(actualQuotes).toEqual(expect.arrayContaining(expectedQuotes));
      },
    );
  });
  describe('by url', () => {
    it('creates a highlight by calling underlying byId service function', async () => {
      const url = 'http://test.com/abc';
      const createSpy = jest.spyOn(HighlightsModel.prototype, 'createMany');
      nock(config.parser.baseEndpoint)
        .get(config.parser.dataPath)
        .query({
          noArticle: '1',
          createIfNone: '0',
          output: 'regular',
          url,
        })
        .reply(200, { item_id: '1' });
      const variables: { input: CreateHighlightByUrlInput } = {
        input: {
          url: 'http://test.com/abc',
          version: 2,
          patch: 'Prow scuttle parrel',
          quote: 'provost Sail ho shrouds spirits boom',
        },
      };
      const expectedVars = {
        ...variables.input,
        url: new URL(url),
        itemId: '1',
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(baseHeaders)
        .send({ query: print(CREATE_HIGHLIGHT_BY_URL), variables });
      const result = res.body.data?.createHighlightByUrl;
      expect(result.patch).toBe('Prow scuttle parrel');
      expect(result.quote).toBe('provost Sail ho shrouds spirits boom');
      expect(createSpy).toHaveBeenCalledExactlyOnceWith([expectedVars]);
    });
  });
});
