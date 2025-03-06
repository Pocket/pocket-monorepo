import { seed } from '../testUtils';
import {
  AnnotationsDataExportService,
  AnnotationsExportEntry,
} from './annotationsExportService';
import { writeClient, eventBridgeClient } from './clients';
import { config } from '../config';
import { S3Bucket, cleanupS3Bucket } from '@pocket-tools/aws-utils';
import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';

describe('AnnotationsExportService', () => {
  const userId = 453432;
  const encodedId = '4a5b3c';
  const bucket = new S3Bucket(config.listExport.exportBucket, {
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const conn = writeClient();
  beforeAll(async () => {
    await cleanupS3Bucket(bucket);
    await conn('list').truncate();
    await conn('user_annotations').truncate();
    const data = seed(userId, 11000, 3210);
    await conn('list').insert(data.list);
    await conn('user_annotations').insert(data.annotations);
  });
  afterAll(async () => {
    await cleanupS3Bucket(bucket);
    await conn('list').truncate();
    await conn('user_annotations').truncate();
    await conn.destroy();
  });
  it('passes a smoke test', async () => {
    const service = new AnnotationsDataExportService(
      userId,
      encodedId,
      conn,
      bucket,
      eventBridgeClient(),
    );
    await service.exportChunk('abc-123', -1, 1000, 0);
    const getObject = new GetObjectCommand({
      Key: 'parts/4a5b3c/annotations/part_000000.json',
      Bucket: config.listExport.exportBucket,
    });
    const result: GetObjectCommandOutput = await bucket.s3.send(getObject);
    const body: AnnotationsExportEntry[] = JSON.parse(
      (await result.Body?.transformToString()) ?? '{}',
    );
    expect(body).toBeArray();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toMatchObject({
      url: expect.toBeString(),
      title: expect.toBeString(),
      // At least one
      highlights: expect.arrayContaining([
        { quote: expect.toBeString(), created_at: expect.toBeNumber() },
      ]),
    });
    const atLeastOneMultiHighlight = body.some(
      (record) => record.highlights.length > 1,
    );
    expect(atLeastOneMultiHighlight).toBeTrue();
  });
});
