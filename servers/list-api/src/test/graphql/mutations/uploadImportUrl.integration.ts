import { ContextManager } from '../../../server/context';
import { startServer } from '../../../server/apollo';
import { Application } from 'express';
import { ApolloServer } from '@apollo/server';
import request from 'supertest';
import gql from 'graphql-tag';
import { print } from 'graphql';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import config from '../../../config';
import { NodeJsClient } from '@smithy/types';
import { setTimeout } from 'node:timers/promises';
import path from 'path';

/**
 * Empty s3 bucket after tests
 */
async function cleanupS3Bucket(s3: NodeJsClient<S3Client>) {
  const client = s3;
  const objectResponse = await client.send<ListObjectsV2Command>(
    new ListObjectsV2Command({
      Bucket: config.aws.s3.importBucket,
      MaxKeys: 0,
    }),
  );
  const keys = objectResponse.Contents?.map((f) => ({ Key: f.Key! }));
  if (keys != null) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: config.aws.s3.importBucket,
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

describe('importUploadUrl mutation', () => {
  let app: Application;
  let server: ApolloServer<ContextManager>;
  let url: string;
  const s3: NodeJsClient<S3Client> = new S3Client({
    endpoint: config.aws.endpoint,
    region: config.aws.region,
    maxAttempts: 3,
    forcePathStyle: config.aws.endpoint != null ? true : false,
  });
  const headers = {
    userid: '1',
    encodedid: 'abc123',
  };
  const importUrlMutation = gql`
    mutation importUploadUrl($importType: ImportType!) {
      importUploadUrl(importType: $importType) {
        ... on PreSignedUrl {
          url
        }
        ... on ImportLimited {
          __typename
          refreshInHours
        }
      }
    }
  `;
  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));
  });
  afterEach(async () => {
    await cleanupS3Bucket(s3);
    jest.clearAllMocks();
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await server.stop();
  });
  it('successfully retrieves a signedUrl', async () => {
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(importUrlMutation),
        variables: { importType: 'omnivore' },
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.importUploadUrl.url).toBeString();
  });
  it('rejects request if file already exists', async () => {
    const fileKey = path.join(
      '1',
      'omnivore',
      `${new Date().toISOString().split('T')[0]}.zip`,
    );
    await s3.send<PutObjectCommand>(
      new PutObjectCommand({
        Bucket: config.aws.s3.importBucket,
        Key: fileKey,
        Body: 'hello world',
      }),
    );
    const res = await request(app)
      .post(url)
      .set(headers)
      .send({
        query: print(importUrlMutation),
        variables: { importType: 'omnivore' },
      });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.importUploadUrl.__typename).toEqual('ImportLimited');
    expect(res.body.data.importUploadUrl.refreshInHours).toBeGreaterThan(0);
  });
});
