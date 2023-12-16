import { ApolloServer } from '@apollo/server';
import { startServer } from '../../server';
import sinon from 'sinon';
import request from 'supertest';
import { print } from 'graphql';
import { IContext } from '../../context';
import { readClient } from '../../database/client';
import { seedData } from '../query/highlights-fixtures';
import { UPDATE_HIGHLIGHT } from './highlights-mutations';
import { HighlightEntity, HighlightUpdateInput } from '../../types';
import { UsersMeta } from '../../dataservices/usersMeta';
import { mysqlTimeString } from '../../dataservices/utils';
import config from '../../config';

describe('Highlights update', () => {
  let app: Express.Application;
  let server: ApolloServer<IContext>;
  let graphQLUrl: string;
  const headers = { userId: '1', premium: 'false' };
  const db = readClient();
  const now = new Date();
  const testData = seedData(now);
  const truncateAndSeed = async () => {
    await Promise.all(
      Object.keys(testData).map((table) => db(table).truncate()),
    );
    await Promise.all(
      Object.entries(testData).map(([table, data]) => db(table).insert(data)),
    );
  };
  beforeAll(async () => {
    ({ app, server, url: graphQLUrl } = await startServer(0));
  });
  afterAll(async () => {
    await server.stop();
  });
  beforeEach(async () => {
    await truncateAndSeed();
  });
  it('should update an existing highlight owned by the user', async () => {
    const updateDate = new Date(2022, 3, 3);
    const clock = sinon.useFakeTimers({
      now: updateDate,
      shouldAdvanceTime: false,
    });

    const input = {
      itemId: '1',
      version: 2,
      patch: 'Prow scuttle parrel',
      quote: 'provost Sail ho shrouds spirits boom',
    };
    const id = 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b';
    const variables: { id: string; input: HighlightUpdateInput } = {
      id,
      input,
    };
    const res = await request(app)
      .post(graphQLUrl)
      .set(headers)
      .send({ query: print(UPDATE_HIGHLIGHT), variables });
    const usersMetaRecord = await db('users_meta')
      .where({ user_id: '1', property: UsersMeta.propertiesMap.account })
      .pluck('value');
    const listRecord = await db('list')
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

    clock.restore();
  });
  it('should throw a NOT_FOUND error if the annotation_id does not exist', async () => {
    const variables: { id: string; input: HighlightUpdateInput } = {
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
    await db('user_annotations').insert({
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
    const variables: { id: string; input: HighlightUpdateInput } = {
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
    const dbRow = await db<HighlightEntity>('user_annotations')
      .select()
      .where('annotation_id', variables.id);

    expect(dbRow.length).toEqual(1);
    expect(res.body.errors?.[0].message).toContain(
      'Error - Not Found: No annotation found for the given ID',
    );
  });
});
