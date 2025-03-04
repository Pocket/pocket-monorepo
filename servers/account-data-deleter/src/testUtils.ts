import Chance from 'chance';
import { S3Bucket } from './dataService/s3Service';
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

export function seed(
  userId: number,
  listCount: number,
  annotationCount: number,
  chance?: Chance.Chance,
) {
  const now = new Date();
  const rand = chance ?? new Chance();
  const randDate = () =>
    rand.date({
      min: new Date('2014-01-01T00:00:00.000Z'),
      max: now,
    }) as Date;
  const list = [...Array(listCount).keys()].map((itemId) => {
    return {
      user_id: userId,
      item_id: itemId + 1,
      resolved_id: itemId + 1,
      given_url: rand.url(),
      title: rand.sentence({ words: 7 }),
      time_added: randDate(),
      time_updated: randDate(),
      time_read: randDate(),
      time_favorited: randDate(),
      api_id: 123,
      status: rand.weighted([0, 1, 2], [10, 5, 1]),
      favorite: rand.weighted([0, 1], [10, 1]),
      api_id_updated: 123,
    };
  });
  // Force some items with none and more with multiple
  const listItems = rand.pickset(
    list.map((_) => _.item_id),
    Math.round(Math.max(listCount, annotationCount) / 4),
  );
  const annotations = [...Array(annotationCount).keys()].map((_) => {
    return {
      annotation_id: rand.guid({ version: 4 }),
      user_id: userId,
      item_id: rand.pickone(listItems),
      quote: rand.sentence(),
      created_at: randDate(),
      patch: '<pkt_annotation></pkt_annotation>',
    };
  });
  return { list, annotations };
}
