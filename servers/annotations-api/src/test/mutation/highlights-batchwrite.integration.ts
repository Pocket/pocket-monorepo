import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../context';
import { startServer } from '../../server';
import { readClient, writeClient } from '../../database/client';
import { seedData } from '../query/highlights-fixtures';
import {
  BATCH_WRITE_HIGHLIGHTS,
  CREATE_HIGHLIGHTS,
} from './highlights-mutations';
import { BatchWriteHighlightsInput } from '../../types';
import { UsersMeta } from '../../dataservices/usersMeta';
import { mysqlTimeString } from '../../dataservices/utils';
import config from '../../config';
import { v4 as uuid } from 'uuid';
import { Application } from 'express';

describe('Highlights batchWrite', () => {
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
      const variables: { input: BatchWriteHighlightsInput } = {
        input: {
          create: [
            {
              itemId: '3',
              version: 2,
              patch: 'Prow scuttle parrel',
              quote: 'provost Sail ho shrouds spirits boom',
            },
          ],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const result = res.body.data?.batchWriteHighlights;

      const expected = {
        deleted: [],
        created: expect.toIncludeSameMembers([
          {
            id: expect.toBeString(),
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
            _createdAt: expect.toBePositive(),
            _updatedAt: expect.toBePositive(),
          },
        ]),
      };
      expect(result).toEqual(expected);
    });
    it('should optionally accept a UUID passed from the client and use for the ID', async () => {
      const id = uuid();
      const variables: { input: BatchWriteHighlightsInput } = {
        input: {
          create: [
            {
              id,
              itemId: '3',
              version: 2,
              patch: 'Prow scuttle parrel',
              quote: 'provost Sail ho shrouds spirits boom',
            },
          ],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const result = res.body.data?.batchWriteHighlights;

      const expected = {
        deleted: [],
        created: expect.toIncludeSameMembers([
          {
            id,
            version: 2,
            patch: 'Prow scuttle parrel',
            quote: 'provost Sail ho shrouds spirits boom',
            _createdAt: expect.toBePositive(),
            _updatedAt: expect.toBePositive(),
          },
        ]),
      };
      expect(result).toEqual(expected);
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
        input: {
          create: [
            {
              id,
              itemId: '1',
              version: 2,
              patch: 'Prow scuttle parrel',
              quote: 'Bring a spring upon her cable holystone',
            },
          ],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const result = res.body.errors;
      expect(result.length).toBe(1);
      expect(result[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
    });
    it('should create a highlight on a SavedItem with existing highlights', async () => {
      const variables: { input: BatchWriteHighlightsInput } = {
        input: {
          create: [
            {
              itemId: '1',
              version: 2,
              patch: 'Prow scuttle parrel',
              quote: 'provost Sail ho shrouds spirits boom',
            },
          ],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const result = res.body.data?.batchWriteHighlights.created;

      expect(result.length).toEqual(1);
      expect(result[0].quote).toBe('provost Sail ho shrouds spirits boom');
    });
    it('should mark the list item as updated and log the highlight mutation', async () => {
      const updateDate = new Date(2022, 3, 3);

      jest.useFakeTimers({
        now: updateDate,
        advanceTimers: true,
      });

      const variables: { input: BatchWriteHighlightsInput } = {
        input: {
          create: [
            {
              itemId: '3',
              version: 2,
              patch: 'Prow scuttle parrel',
              quote: 'provost Sail ho shrouds spirits boom',
            },
          ],
        },
      };
      await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const usersMetaRecord = await writeDb('users_meta')
        .where({ user_id: '1', property: UsersMeta.propertiesMap.account })
        .pluck('value');

      const listRecord = await writeDb('list')
        .where({ user_id: '1', item_id: '3' })
        .pluck('time_updated');

      expect(mysqlTimeString(listRecord[0])).toEqual(
        mysqlTimeString(updateDate, config.database.tz),
      );
      expect(usersMetaRecord[0]).toEqual(
        mysqlTimeString(updateDate, config.database.tz),
      );
    });
    it('should delete an existing highlight', async () => {
      const variables = {
        input: {
          delete: ['b3a95dd3-dd9b-49b0-bb72-dc6daabd809b'],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const result = res.body.data?.batchWriteHighlights;

      const expected = {
        deleted: ['b3a95dd3-dd9b-49b0-bb72-dc6daabd809b'],
        created: [],
      };
      expect(result).toEqual(expected);
    });
    it('should delete and create highlights at the same time', async () => {
      const createInput = [
        {
          version: 2,
          patch: 'broadside cable strike colors',
          quote: 'Case shot Shiver me timbers gangplank',
        },
        {
          version: 2,
          patch: 'Prow scuttle parrel',
          quote: 'provost Sail ho shrouds spirits boom',
        },
      ];
      const variables = {
        input: {
          delete: [
            'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
            'aafa87bc-9742-416c-a517-e3cd801f2761',
          ],
          create: [
            {
              itemId: '3',
              ...createInput[0],
            },
            {
              itemId: '1',
              ...createInput[1],
            },
          ],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const result = res.body.data?.batchWriteHighlights;
      expect(res.body.errors).toBeUndefined();

      const matchers = {
        id: expect.toBeString(),
        _createdAt: expect.toBePositive(),
        _updatedAt: expect.toBePositive(),
      };

      const expected = {
        deleted: expect.toIncludeSameMembers(variables.input.delete),
        created: expect.toIncludeSameMembers(
          createInput.map((create) => ({ ...create, ...matchers })),
        ),
      };
      expect(result).toEqual(expected);
    });
    it('should not error if deleting a non-existent highlight', async () => {
      const variables = {
        input: {
          delete: ['b3a95dd3-dd9b-49b0-bb72-dc6daabd809b', 'obviously-fake-id'],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      const result = res.body.data?.batchWriteHighlights;

      const expected = {
        deleted: ['b3a95dd3-dd9b-49b0-bb72-dc6daabd809b', 'obviously-fake-id'],
        created: [],
      };
      expect(result).toEqual(expected);
    });
    it('should roll back to initial state if any error', async () => {
      const id = uuid();
      const variables = {
        input: {
          delete: ['b3a95dd3-dd9b-49b0-bb72-dc6daabd809b'],
          create: [
            {
              // Collision, will error out
              id: 'aafa87bc-9742-416c-a517-e3cd801f2761',
              itemId: '2',
              version: 2,
              patch: 'broadside cable strike colors',
              quote: 'Case shot Shiver me timbers gangplank',
            },
            {
              id,
              itemId: '1',
              version: 2,
              patch: 'Prow scuttle parrel',
              quote: 'provost Sail ho shrouds spirits boom',
            },
          ],
        },
      };
      const res = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({ query: print(BATCH_WRITE_HIGHLIGHTS), variables });
      expect(res.body.errors).toBeArrayOfSize(1);
      expect(res.body.errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
      const notDeleted = await readDb('user_annotations').where({
        annotation_id: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
      });
      expect(notDeleted).toBeArrayOfSize(1);
      const notChanged = await readDb('user_annotations')
        .where({
          annotation_id: 'aafa87bc-9742-416c-a517-e3cd801f2761',
        })
        .first();
      expect(notChanged['quote']).toEqual(
        'You and a thousand of your friends would have to work for a century or so to reproduce it.',
      );
      const notAdded = await readDb('user_annotations').where({
        annotation_id: id,
      });
      expect(notAdded).toBeArrayOfSize(0);
    });
  });
});
