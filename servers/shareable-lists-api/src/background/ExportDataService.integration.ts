import { ExportDataService, ListExport } from './ExportDataService';
import { conn as db } from '../database/client';
import config from '../config';
import { S3Bucket, cleanupS3Bucket } from '@pocket-tools/aws-utils';
import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { eventBridgeClient } from '../aws/eventBridgeClient';
import path from 'path';

describe('AnnotationsExportService', () => {
  const userId = 12345;
  const encodedId = '4a5b3c';
  const bucket = new S3Bucket(config.export.bucket.name, {
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const conn = db();
  beforeAll(async () => {
    await cleanupS3Bucket(bucket);
  });
  afterAll(async () => {
    await cleanupS3Bucket(bucket);
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
    // More than 1 file written to proper path
    expect(exportedFiles.length).toBeGreaterThan(1);
    const getObject = new GetObjectCommand({
      Key: exportedFiles[0],
      Bucket: config.export.bucket.name,
    });
    const result: GetObjectCommandOutput = await bucket.s3.send(getObject);
    const body: ListExport = JSON.parse(
      (await result.Body?.transformToString()) ?? '{}',
    );
    // Has the slug in the filename
    expect(exportedFiles[0]).toMatch(body.slug);
    // Has expected data shape
    expect(body).toMatchObject({
      createdAt: expect.toBeDateString(),
      description: expect.toBeString(),
      title: expect.toBeString(),
      slug: expect.toBeString(),
      // At least one
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
