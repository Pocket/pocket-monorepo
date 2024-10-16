import {
  DeleteObjectsCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { config } from '../config';
import { S3Bucket } from './s3Service';
import { stringify } from 'csv-stringify/sync';
import { setTimeout } from 'node:timers/promises';
import AdmZip from 'adm-zip';
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

describe('s3Bucket', () => {
  const client = new S3Bucket(config.listExport.exportBucket);
  beforeAll(async () => await cleanupS3Bucket(client));
  afterAll(async () => await cleanupS3Bucket(client));
  it('writes a list of records to a csv', async () => {
    const records = [
      {
        url: 'https://pocket.co/share/ddc34034-3794-4b6e-91b2-fa4992eec4dc',
        title: 'My binary vector search is better than your FP32 vectors',
        time_added: 112345578,
        tags: 'search|binary-vec',
      },
      {
        url: 'https://pocket.co/share/f099470a-2752-4a1e-94a0-f16ff666856d',
        title: 'what vegetable are you?',
        time_added: 12345678,
        tags: null,
      },
    ];
    const response = await client.writeCsv(records, 'csv-testing/part_0000');
    const getObject = new GetObjectCommand({
      Key: 'csv-testing/part_0000.csv',
      Bucket: config.listExport.exportBucket,
    });
    const result: GetObjectCommandOutput = await client.s3.send(getObject);
    const data = await result.Body?.transformToString();
    const output = stringify(records, {
      header: true,
      columns: {
        url: 'url',
        title: 'title',
        time_added: 'time_added',
        tags: 'tags',
      },
    });
    expect(response).toBeTrue();
    expect(data).toEqual(output);
  });
  it('Throws error if fail to write the csv', async () => {
    const records = [{ a: 'a', b: 'b' }];
    const noBucket = new S3Bucket('com.nonexistent-bucket');
    expect.assertions(1);
    try {
      await noBucket.writeCsv(records, 'csv-testing/part_0000');
    } catch (error) {
      expect(error).not.toBeUndefined();
    }
  });
  it('returns false for objectExists on a missing file', async () => {
    const exists = await client.objectExists('non/existant/file.txt');
    expect(exists).toBeFalse();
  });
  it('returns true for object that exists', async () => {
    const response = await client.writeCsv(
      [{ a: 'a', b: 'b' }],
      'existence-testing/part_0000',
    );
    const exists = await client.objectExists('existence-testing/part_0000.csv');
    expect(response).toBeTrue();
    expect(exists).toBeTrue();
  });
  it('zips files by prefix', async () => {
    const inputs = [
      {
        data: [{ a: 1, b: 2 }],
        name: 'zip-testing/part_0000',
        expectedData: 'a,b\n1,2\n',
        expectedName: 'part_0000.csv',
      },
      {
        data: [{ a: 3, b: 4 }],
        name: 'zip-testing/part_0001',
        expectedData: 'a,b\n3,4\n',
        expectedName: 'part_0001.csv',
      },
      {
        data: [{ a: 5, b: 6 }],
        name: 'zip-testing/part_0002',
        expectedData: 'a,b\n5,6\n',
        expectedName: 'part_0002.csv',
      },
    ];
    for await (const { data, name } of inputs) {
      await client.writeCsv(data, name);
    }
    const zipKey = await client.zipFilesByPrefix('zip-testing', 'ziptest.zip');
    expect(zipKey).not.toBeUndefined();
    const zipFileResponse = await client.s3.send<GetObjectCommand>(
      new GetObjectCommand({ Bucket: client.bucket, Key: zipKey!.Key }),
    );
    const exists = await client.objectExists(zipKey!.Key);
    expect(exists).toBeTrue();
    expect(zipFileResponse.Body).not.toBeUndefined();
    const buffer = Buffer.from(
      await zipFileResponse.Body!.transformToByteArray(),
    );
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    // expect(entries.length).toEqual(3);
    // Iterate over the files in the ZIP archive
    entries.forEach((entry, ix) => {
      const content = entry.getData().toString('utf8'); // Get the file content as Buffer
      expect(entry.entryName).toEqual(inputs[ix].expectedName);
      expect(content).toEqual(inputs[ix].expectedData);
    });
  });
});
