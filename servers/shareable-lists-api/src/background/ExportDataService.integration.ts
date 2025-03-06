import { ExportDataService, ListExport } from './ExportDataService';
import { client, conn as db } from '../database/client';
import config from '../config';
import { S3Bucket, cleanupS3Bucket } from '@pocket-tools/aws-utils';
import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import path from 'path';
import {
  createShareableListHelper,
  clearDb,
  createShareableListItemHelper,
} from '../test/helpers';

describe('ExportDataService', () => {
  const userId = 3483487;
  const encodedId = '4a5b3c';
  const bucket = new S3Bucket(config.export.bucket.name, {
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const conn = db();
  const prisma = client();
  beforeAll(async () => {
    await cleanupS3Bucket(bucket);
    await createShareableListHelper(prisma, {
      userId,
      title: 'Empty list',
    });
    const someList = await createShareableListHelper(prisma, {
      userId,
      title: 'List of Stuff!',
    });
    await Promise.all(
      [...Array(40).keys()].map((ix) =>
        createShareableListItemHelper(prisma, {
          list: someList,
          sortOrder: ix,
        }),
      ),
    );
  });
  afterAll(async () => {
    await cleanupS3Bucket(bucket);
    await clearDb(prisma);
    await conn.destroy();
  });
  it('passes a smoke test', async () => {
    const service = new ExportDataService(
      userId,
      encodedId,
      conn,
      bucket,
      eventBridgeClient,
    );
    await service.exportChunk('abc-123', -1, 1000, 0);
    const exportedFiles = await bucket.listAllObjects(
      path.join(config.export.bucket.partsPrefix, encodedId, 'collections'),
    );
    expect(exportedFiles).toIncludeSameMembers([
      'parts/4a5b3c/collections/empty-list.json',
      'parts/4a5b3c/collections/list-of-stuff.json',
    ]);
    // More than 1 file written to proper path
    expect(exportedFiles.length).toBeGreaterThan(1);
    const getList = async (key: string) => {
      const getObject = new GetObjectCommand({
        Key: key,
        Bucket: config.export.bucket.name,
      });
      const result: GetObjectCommandOutput = await bucket.s3.send(getObject);
      const body: ListExport = JSON.parse(
        (await result.Body?.transformToString()) ?? '{}',
      );
      return body;
    };
    const emptyList = await getList('parts/4a5b3c/collections/empty-list.json');
    expect(emptyList).toMatchObject({
      createdAt: expect.toBeDateString(),
      description: expect.toBeString(),
      title: expect.toBeString(),
      slug: expect.toBeString(),

      items: expect.toBeArrayOfSize(0),
    });
    const listOfStuff = await getList(
      'parts/4a5b3c/collections/list-of-stuff.json',
    );
    // Has expected data shape
    expect(listOfStuff).toMatchObject({
      createdAt: expect.toBeDateString(),
      description: expect.toBeString(),
      title: expect.toBeString(),
      slug: expect.toBeString(),
      // At least one
      items: expect.toBeArrayOfSize(40),
    });
    expect(listOfStuff).toMatchObject({
      items: expect.arrayContaining([
        {
          excerpt: expect.toBeString(),
          note: expect.toBeString(),
          title: expect.toBeString(),
          url: expect.toBeString(),
        },
      ]),
    });
  });
});
