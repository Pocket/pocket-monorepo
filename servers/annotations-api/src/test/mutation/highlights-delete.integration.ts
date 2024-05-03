import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server/index.js';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../context.js';
import { readClient, writeClient } from '../../database/client.js';
import { seedData } from '../query/highlights-fixtures.js';
import { DELETE_HIGHLIGHT } from './highlights-mutations.js';
import { HighlightEntity } from '../../types.js';
import { UsersMeta } from '../../dataservices/usersMeta.js';
import { mysqlTimeString } from '../../dataservices/utils.js';
import config from '../../config/index.js';
import { Application } from 'express';

describe('Highlights deletion', () => {
  let app: Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;

  const headers = { userId: '1', premium: 'false' };
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
    await readDb.destroy();
    await writeDb.destroy();
  });

  beforeEach(async () => {
    await truncateAndSeed();
  });

  it('should delete an existing highlight', async () => {
    const updateDate = new Date(2022, 3, 3);

    jest.useFakeTimers({
      now: updateDate,
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

    const variables = { id: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b' };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(DELETE_HIGHLIGHT), variables });
    const annotationRecord = await writeDb<HighlightEntity>('user_annotations')
      .select()
      .where('annotation_id', variables.id);
    const usersMetaRecord = await writeDb('users_meta')
      .where({ user_id: '1', property: UsersMeta.propertiesMap.account })
      .pluck('value');
    const listRecord = await writeDb('list')
      .where({ user_id: '1', item_id: '1' })
      .pluck('time_updated');

    expect(res).toBeTruthy();
    expect(res.body.data?.deleteSavedItemHighlight).toBe(variables.id);
    expect(annotationRecord[0].status).toBe(0);
    expect(usersMetaRecord[0]).toEqual(
      mysqlTimeString(updateDate, config.database.tz),
    );
    expect(mysqlTimeString(listRecord[0])).toEqual(
      mysqlTimeString(updateDate, config.database.tz),
    );

    jest.useRealTimers();
  });

  it('should throw NOT_FOUND error if the highlight ID does not exist', async () => {
    const variables = { id: '999' };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(DELETE_HIGHLIGHT), variables });
    expect(res.body.errors).toBeTruthy();

    if (res.body.errors) {
      expect(res.body.errors[0].message).toBe(
        'Error - Not Found: No annotation found for the given ID',
      );
    }
  });
});
