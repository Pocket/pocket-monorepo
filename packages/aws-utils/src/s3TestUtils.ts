import { S3Bucket } from './S3Bucket.ts';
import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { setTimeout } from 'node:timers/promises';

/**
 * Empty s3 bucket after tests
 */
export async function cleanupS3Bucket(s3: S3Bucket) {
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
