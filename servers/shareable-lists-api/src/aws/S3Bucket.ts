import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { NodeJsClient } from '@smithy/types';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';
import config from '../config';
import { NodeHttpHandler } from '@smithy/node-http-handler';

export class S3Bucket {
  // Client with type narrowing
  // (types are wide in the library for browser compat)
  s3: NodeJsClient<S3Client>;
  constructor(public readonly bucket: string) {
    this.s3 = new S3Client({
      endpoint: config.aws.endpoint,
      region: config.aws.region,
      maxAttempts: 3,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 0, // disable timeout because we might be processing huge zipfiles
      }),
      forcePathStyle: config.aws.endpoint != null ? true : false,
    });
  }
  /**
   * Write a JSON object to a file in S3, using the provided key
   * (which should not include file
   * extension; it will be added automatically).
   * This method will not throw errors if the record fails to write;
   * errors will be logged in Cloudwatch and Sentry internally.
   * @param records A valid JSON-serializable object
   * @param key The file key, without file extension. Can be a
   * path.
   * @returns true if the write succeeded, false otherwise
   */
  async writeJson(records: any, key: string): Promise<boolean> {
    try {
      const uploads = new Upload({
        client: this.s3,
        params: {
          Bucket: `${this.bucket}`,
          Key: `${key}.json`,
          ContentType: 'application/json, charset=utf-8',
          Body: JSON.stringify(records),
        },
      });
      await uploads.done();
      return true;
    } catch (err) {
      serverLogger.error({
        message: 'Failed to write json to s3',
        errorData: err,
        key,
        bucket: this.bucket,
      });
      Sentry.captureException(err, { data: { key, bucket: this.bucket } });
      throw err;
    }
  }
}
