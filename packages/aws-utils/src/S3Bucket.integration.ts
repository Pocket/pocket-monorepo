import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { S3Bucket } from './S3Bucket.ts';
import { stringify } from 'csv-stringify/sync';
import AdmZip from 'adm-zip';
import { cleanupS3Bucket } from './s3TestUtils.ts';

describe('s3Bucket', () => {
  // Created in the .docker/ infrastructure
  const bucket = 'com.getpocket.list-exports';
  const client = new S3Bucket(bucket, { endpoint: 'http://localhost:4566' });
  beforeAll(async () => await cleanupS3Bucket(client));
  afterAll(async () => await cleanupS3Bucket(client));
  describe('file expiration check', () => {
    beforeAll(() =>
      jest.useFakeTimers({
        now: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // add 5 days to now (3 day expire period)
      }),
    );
    afterAll(() => jest.useRealTimers());
    it('returns false if record is expired but not yet deleted', async () => {
      const response = await client.writeCsv(
        [{ a: 'a', b: 'b' }],
        'archives/part_0000',
      );
      const exists = await client.objectExists('archives/part_0000.csv');
      expect(response).toBeTrue();
      expect(exists).toBeFalse();
    });
    it('returns true if there is no expiration configured', async () => {
      const response = await client.writeCsv(
        [{ a: 'a', b: 'b' }],
        'unexpiring-prefix/part_0000',
      );
      const exists = await client.objectExists(
        'unexpiring-prefix/part_0000.csv',
      );
      expect(response).toBeTrue();
      expect(exists).toBeTrue();
    });
  });
  it('writes records to json', async () => {
    const records = [
      {
        url: 'https://pocket.co/share/ddc34034-3794-4b6e-91b2-fa4992eec4dc',
        quote: 'remarkable 30x reduction',
        time_added: 112345578,
      },
      {
        url: 'https://pocket.co/share/f099470a-2752-4a1e-94a0-f16ff666856d',
        quote: 'what vegetable are you?',
        time_added: 12345678,
      },
    ];
    const response = await client.writeJson(records, 'json-testing/part_0000');
    const getObject = new GetObjectCommand({
      Key: 'json-testing/part_0000.json',
      Bucket: bucket,
    });
    const result: GetObjectCommandOutput = await client.s3.send(getObject);
    const data = await result.Body?.transformToString();
    expect(response).toBeTrue();
    expect(data).toEqual(JSON.stringify(records));
  });
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
      Bucket: bucket,
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
  it('returns true for object that exists and is not expired', async () => {
    const response = await client.writeCsv(
      [{ a: 'a', b: 'b' }],
      'archives/part_0000',
    );
    const exists = await client.objectExists('archives/part_0000.csv');
    expect(response).toBeTrue();
    expect(exists).toBeTrue();
  });
  it('zips files by prefix', async () => {
    const inputs = [
      {
        data: [{ a: 5, b: 6 }],
        name: 'zip-testing/user/annotations/part_0000',
        expectedData: 'a,b\n5,6\n',
        expectedName: 'annotations/part_0000.csv',
      },
      {
        data: [{ a: 5, b: 6 }],
        name: 'zip-testing/user/collections/part_0000',
        expectedData: 'a,b\n5,6\n',
        expectedName: 'collections/part_0000.csv',
      },
      {
        data: [{ a: 5, b: 6 }],
        name: 'zip-testing/user/collections/part_0001',
        expectedData: 'a,b\n5,6\n',
        expectedName: 'collections/part_0001.csv',
      },
      {
        data: [{ a: 1, b: 2 }],
        name: 'zip-testing/user/part_0000',
        expectedData: 'a,b\n1,2\n',
        expectedName: 'part_0000.csv',
      },
      {
        data: [{ a: 3, b: 4 }],
        name: 'zip-testing/user/part_0001',
        expectedData: 'a,b\n3,4\n',
        expectedName: 'part_0001.csv',
      },
      {
        data: [{ a: 5, b: 6 }],
        name: 'zip-testing/user/part_0002',
        expectedData: 'a,b\n5,6\n',
        expectedName: 'part_0002.csv',
      },
    ];
    for await (const { data, name } of inputs) {
      await client.writeCsv(data, name);
    }
    const zipKey = await client.zipFilesByPrefix(
      'zip-testing/user',
      'ziptest.zip',
    );
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
    // Iterate over the files in the ZIP archive
    entries.forEach((entry, ix) => {
      const content = entry.getData().toString('utf8'); // Get the file content as Buffer
      expect(entry.entryName).toEqual(inputs[ix].expectedName);
      expect(content).toEqual(inputs[ix].expectedData);
    });
  });
});
