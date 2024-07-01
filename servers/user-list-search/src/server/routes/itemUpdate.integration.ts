import { config } from '../../config';
import { seedDb } from '../../test/utils/saveSeeder';
import { getDocument } from '../../datasource/elasticsearch/elasticsearchSearch';
import { client } from '../../datasource/elasticsearch';
import { Application } from 'express';
import { ContextManager } from '../context';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import { startServer } from '../serverUtils';
import {
  contentDb,
  knexDbReadClient,
} from '../../datasource/clients/knexClient';

//Set this here so the client instantiates outside of the before block that has a timeout.
const esClient = client;

describe('itemUpdate', () => {
  let server: ApolloServer<ContextManager>;
  let app: Application;

  afterAll(async () => {
    await server.stop();
    esClient.close();
    knexDbReadClient().destroy();
    contentDb().destroy();
    jest.resetAllMocks();
  });

  beforeAll(async () => {
    await esClient.deleteByQuery({
      index: config.aws.elasticsearch.list.index,
      type: config.aws.elasticsearch.list.type,
      body: {
        query: {
          match_all: {},
        },
      },
    });
    // Wait for delete to finish
    await esClient.indices.refresh({
      index: config.aws.elasticsearch.list.index,
    });

    ({ app, server } = await startServer(0));
  });

  it('processes item index queue', async () => {
    await Promise.all([
      seedDb({
        truncate: true,
        userCount: 2,
        listCount: 10,
        tagCount: 5,
        forcePremium: true,
      }),
    ]);

    const testItems = [
      {
        userId: 1,
        itemIds: [1, 2, 3, 4, 5],
      },
      {
        userId: 2,
        itemIds: [6, 7, 8, 9, 10],
      },
    ];

    for (const testObject of testItems) {
      const res = await request(app).post('/itemUpdate').send(testObject);
      expect(res.status).toBe(200);
    }

    // Wait for background indexing to finish
    await esClient.indices.refresh({
      index: config.aws.elasticsearch.list.index,
    });

    //Ensure each document we just passed along was indexed for user 1
    for (let i = 1; i <= 5; i++) {
      const doc = await getDocument(`1-${i}`);
      expect(doc._id).toBe(`1-${i}`);
    }

    //Ensure each document we just passed alone was indexed for user 2
    for (let i = 6; i <= 10; i++) {
      const doc = await getDocument(`2-${i}`);
      expect(doc._id).toBe(`2-${i}`);
    }
  }, 20000);

  it('processes item index queue when dates are bad', async () => {
    await Promise.all([
      seedDb({
        truncate: true,
        userCount: 2,
        listCount: 10,
        tagCount: 5,
        forcePremium: true,
      }),
    ]);

    await knexDbReadClient().raw(
      'UPDATE readitla_b.items_extended SET date_published = "0000-00-00 00:00:00" ',
    );

    const testItems = [
      {
        userId: 1,
        itemIds: [1, 2, 3, 4, 5],
      },
      {
        userId: 2,
        itemIds: [6, 7, 8, 9, 10],
      },
    ];

    for (const testObject of testItems) {
      const res = await request(app).post('/itemUpdate').send(testObject);
      expect(res.status).toBe(200);
    }

    // Wait for background indexing to finish
    await esClient.indices.refresh({
      index: config.aws.elasticsearch.list.index,
    });

    //Ensure each document we just passed along was indexed for user 1
    for (let i = 1; i <= 5; i++) {
      const doc = await getDocument(`1-${i}`);
      expect(doc._id).toBe(`1-${i}`);
    }

    //Ensure each document we just passed alone was indexed for user 2
    for (let i = 6; i <= 10; i++) {
      const doc = await getDocument(`2-${i}`);
      expect(doc._id).toBe(`2-${i}`);
    }
  }, 20000);
});
