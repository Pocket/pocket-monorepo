import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../server/apollo/context';
import { readClient, writeClient } from '../../database/client';
import { seedData } from '../query/highlights-fixtures';
import { UPDATE_HIGHLIGHT } from './highlights-mutations';
import { HighlightEntity } from '../../types';
import { UpdateHighlightInput } from '../../__generated__/resolvers-types';
import { UsersMeta } from '../../dataservices/usersMeta';
import { mysqlTimeString } from '../../dataservices/utils';
import config from '../../config';
import { Application } from 'express';

describe('Highlights update', () => {
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
  it('should update an existing highlight owned by the user', async () => {
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

    const input = {
      itemId: '1',
      version: 2,
      patch: 'Prow scuttle parrel',
      quote: 'provost Sail ho shrouds spirits boom',
    };
    const id = 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b';
    const variables: { id: string; input: UpdateHighlightInput } = {
      id,
      input,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(UPDATE_HIGHLIGHT), variables });
    const usersMetaRecord = await writeDb('users_meta')
      .where({ user_id: '1', property: UsersMeta.propertiesMap.account })
      .pluck('value');
    const listRecord = await writeDb('list')
      .where({ user_id: '1', item_id: '1' })
      .pluck('time_updated');

    expect(res.body.data?.updateHighlight).toBeTruthy();
    expect(res.body.data?.updateHighlight.patch).toEqual(input.patch);
    expect(res.body.data?.updateHighlight.quote).toEqual(input.quote);
    expect(res.body.data?.updateHighlight.version).toEqual(input.version);
    expect(res.body.data?.updateHighlight.id).toEqual(id);
    expect(usersMetaRecord[0]).toEqual(
      mysqlTimeString(updateDate, config.database.tz),
    );
    expect(mysqlTimeString(listRecord[0])).toEqual(
      mysqlTimeString(updateDate, config.database.tz),
    );

    jest.useRealTimers();
  });
  it('should throw a NOT_FOUND error if the annotation_id does not exist', async () => {
    const variables: { id: string; input: UpdateHighlightInput } = {
      id: '999',
      input: {
        itemId: '1',
        version: 2,
        patch: 'Prow scuttle parrel',
        quote: 'provost Sail ho shrouds spirits boom',
      },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(UPDATE_HIGHLIGHT), variables });
    expect(res.body.errors?.[0]?.message).toContain(
      'Error - Not Found: No annotation found for the given ID',
    );

    expect(res.body.errors?.[0]?.extensions?.code).toEqual('NOT_FOUND');
  });
  it('should throw a NOT_FOUND error if the annotation_id is not owned by the user, and not update', async () => {
    await writeDb('user_annotations').insert({
      annotation_id: '05347f61-8fee-4e54-8cd6-618b02c39c73',
      user_id: 2,
      item_id: 2,
      patch: 'Prow scuttle parrel',
      quote: 'provost Sail ho shrouds spirits boom',
      version: 1,
      status: 1,
      updated_at: now,
      created_at: now,
    });
    const variables: { id: string; input: UpdateHighlightInput } = {
      id: '05347f61-8fee-4e54-8cd6-618b02c39c73',
      input: {
        itemId: '2',
        version: 2,
        patch: 'wherry doubloon chase',
        quote: 'Belay yo-ho-ho keelhaul squiffy black spot',
      },
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(UPDATE_HIGHLIGHT), variables });
    const dbRow = await writeDb<HighlightEntity>('user_annotations')
      .select()
      .where('annotation_id', variables.id);

    expect(dbRow.length).toEqual(1);
    expect(res.body.errors?.[0].message).toContain(
      'Error - Not Found: No annotation found for the given ID',
    );
  });
});
