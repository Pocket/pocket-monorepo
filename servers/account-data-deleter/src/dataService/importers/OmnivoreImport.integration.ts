import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { config } from '../../config';
import { S3Bucket } from '../s3Service';
import { setTimeout } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'path';
import { OmnivoreImporter } from './OmnivoreImport';
import { SQSClient } from '@aws-sdk/client-sqs';

/**
 * Empty s3 bucket after tests
 */
async function cleanupS3Bucket(s3: S3Bucket) {
  const client = s3.s3;
  const objectResponse = await client.send<ListObjectsV2Command>(
    new ListObjectsV2Command({ Bucket: s3.bucket, MaxKeys: 0 }),
  );
  const keys = objectResponse.Contents?.map((f) => ({ Key: f.Key! }));
  if (keys != null) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: s3.bucket,
        Delete: { Objects: keys },
      }),
    );
    // Wait a short time
    // AWS provides waitUntilObjectNotExists method, but the
    // client types seem to be improperly configured and so
    // the compiler is throwing error as of 10/10/24
    await setTimeout(50);
  }
}

describe('importer', () => {
  const client = new S3Bucket(config.listImport.importBucket);
  const omnivoreKey = 'abc123/omnivore/import.zip';
  const omnivoreInvalid = 'abc123/omnivore/import-invalid.zip';
  const sendSpy = jest.spyOn(SQSClient.prototype, 'send');

  beforeEach(() => sendSpy.mockReset());

  beforeAll(async () => {
    await cleanupS3Bucket(client);
    await client.s3.send<PutObjectCommand>(
      new PutObjectCommand({
        Bucket: client.bucket,
        Key: omnivoreKey,
        Body: fs.readFileSync(
          path.resolve(__dirname, '../../../test/imports/omnivore-test.zip'),
        ),
      }),
    );
    // All records are invalid (required field missing/null, wrong type,
    // extra field added, invalid timestamp format, invalid enum value)
    await client.s3.send<PutObjectCommand>(
      new PutObjectCommand({
        Bucket: client.bucket,
        Key: omnivoreInvalid,
        Body: fs.readFileSync(
          path.resolve(__dirname, '../../../test/imports/omnivore-invalid.zip'),
        ),
      }),
    );
  });
  afterAll(async () => {
    await cleanupS3Bucket(client);
    jest.clearAllMocks();
  });
  it('loads entries from a zip archive with prefix filter', async () => {
    const entries = await new OmnivoreImporter(client, omnivoreKey).loadArchive(
      omnivoreKey,
      'metadata',
    );
    expect(entries).toHaveLength(3);
  });
  it('parses json data into a consolidated array of records', async () => {
    const entries = await new OmnivoreImporter(
      client,
      omnivoreKey,
    ).loadImport();
    expect(entries).toHaveLength(60);
    expect(entries[0]).toContainAllKeys([
      'id',
      'slug',
      'title',
      'description',
      'author',
      'url',
      'state',
      'readingProgress',
      'thumbnail',
      'labels',
      'savedAt',
      'updatedAt',
      'publishedAt',
    ]);
  });
  it('Removes data that does not pass validation', async () => {
    const entries = await new OmnivoreImporter(
      client,
      omnivoreInvalid,
    ).loadImport();
    expect(entries).toHaveLength(0);
  });
  it('sends records to sqs', async () => {
    await new OmnivoreImporter(client, omnivoreKey).start();
    // One message batch with 2 messages
    expect(sendSpy).toHaveBeenCalledOnce();
    const entries = sendSpy.mock.calls[0][0]['input']['Entries'];
    expect(entries).toBeArrayOfSize(2);
    // Spot-check the message
    const message = JSON.parse(entries[0].MessageBody);
    expect(message).toEqual({
      userId: 'abc123',
      importer: 'omnivore',
      records: expect.toBeArrayOfSize(30),
    });
  });
  it('does not throw sqs send errors to caller', async () => {
    // Weird function signature, idk...
    sendSpy.mockRejectedValueOnce(new Error() as unknown as never);
    const result = await new OmnivoreImporter(client, omnivoreKey).start();
    expect(result).toBeUndefined();
  });
});
