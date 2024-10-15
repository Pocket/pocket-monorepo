import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { NodeJsClient } from '@smithy/types';
import { stringify } from 'csv-stringify';
import { PassThrough, Readable } from 'node:stream';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';
import { ResourceNotFoundException } from '@aws-sdk/client-sqs';
import { config } from '../config';
import archiver from 'archiver';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import path from 'node:path';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
   * Write an array of homogenous key, value records to a CSV
   * file in S3, using the provided key (which should not include file
   * extension; it will be added automatically).
   * This method will not throw errors if the record fails to write;
   * errors will be logged in Cloudwatch and Sentry internally.
   * @param records An array of homogenous key,value records to
   * to convert to csv (every element of the array should have the
   * same keys)
   * @param key The file key, without file extension. Can be a
   * path.
   * @returns true if the write succeeded, false otherwise
   */
  async writeCsv(records: any[], key: string): Promise<boolean> {
    // Infer column names from first row (assumes homogenous data)
    const columns = Object.keys(records[0]).reduce(
      (mapping, key) => {
        mapping[key] = key;
        return mapping;
      },
      {} as Record<string, string>,
    );
    try {
      const body = Readable.from(records).pipe(
        stringify({ header: true, columns }),
      );
      const uploads = new Upload({
        client: this.s3,
        params: {
          Bucket: `${this.bucket}`,
          Key: `${key}.csv`,
          ContentType: 'text/csv',
          Body: body,
        },
      });
      await uploads.done();
      return true;
    } catch (err) {
      serverLogger.error({
        message: 'Failed to write csv to s3',
        errorData: err,
        key,
        bucket: this.bucket,
      });
      Sentry.captureException(err, { data: { key, bucket: this.bucket } });
      throw err;
    }
  }
  /**
   * Zip all files that match a prefix
   * @param prefix
   * @param zipPrefix
   * @param destinationBucket optionally, save the zip file in a different
   * bucket than where the files are stored.
   */
  async zipFilesByPrefix(
    prefix: string,
    zipKey: string,
    destinationBucket?: string,
  ): Promise<{ Bucket: string; Key: string } | undefined> {
    const destBucket = destinationBucket ?? this.bucket;
    try {
      const fileKeys = await this.listAllObjects(prefix);
      if (fileKeys != null && fileKeys.length > 0) {
        const archive = await this.streamObjectsArchive(fileKeys);
        serverLogger.info({
          message: 'Archiving export files',
          archiveLen: fileKeys.length,
          prefix,
        });
        Sentry.addBreadcrumb({
          data: {
            message: 'Archiving export files',
            archiveLen: fileKeys.length,
            prefix,
          },
        });
        const passthrough = new PassThrough();
        archive.pipe(passthrough);
        const uploads = new Upload({
          client: this.s3,
          params: {
            Bucket: destBucket,
            Key: zipKey,
            ContentType: 'application/zip',
            Body: passthrough,
          },
        });
        await uploads.done();
        return { Bucket: destBucket, Key: zipKey };
      } else {
        serverLogger.warning({
          message: 'Archive requested, but no files matched prefix',
          prefix,
        });
        return;
      }
    } catch (err) {
      serverLogger.error({
        message: 'Error encountered during archive',
        prefix: prefix,
        errorData: err,
        errorMessage: err.message,
      });
      Sentry.captureException(err, { data: { prefix } });
      throw err;
    }
  }
  /**
   * Should ensure that it exists already -- 404 errors will be
   * thrown to the calling function.
   * @param keys
   * @param stream
   */
  private async streamObjectsArchive(keys: string[]) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', function (err) {
      serverLogger.error({
        message: 'Error archiving files',
        errorData: err,
      });
      Sentry.captureException(err);
      throw err;
    });
    for await (const key of keys) {
      const response = await this.s3.send<GetObjectCommand>(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (response.Body != null) {
        archive.append(response.Body, { name: path.basename(key) });
      }
    }
    archive.finalize();
    return archive;
  }
  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    const expiresIn = expiresInSeconds ?? 60 * 60 * 24 * 7; // 7 days in seconds
    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const url = await getSignedUrl(this.s3, command, {
        expiresIn,
      });
      return url;
    } catch (error) {
      serverLogger.error({
        message: 'Error generating signedUrl',
        key,
        expiresIn,
        bucket: this.bucket,
        errorData: error,
      });
      Sentry.addBreadcrumb({ data: { key, expiresIn, bucket: this.bucket } });
      Sentry.captureException(error);
      throw error;
    }
  }
  /**
   * Check whether object exists in a Bucket with the given key.
   * Will return false if an error (repeatedly) prevents accessing
   * the file, even if it may exist. Encountered errors are logged
   * to Sentry and Cloudwatch.
   * @param key key of the object to check
   * @returns true if object exists (and can be accessed), false
   * otherwise.
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      // Design of this sdk means you have to rely on error handling
      // for 404 responses
      await this.s3.send<HeadObjectCommand>(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      // If it doesn't error it exists (and can be accessed)
      return true;
    } catch (err) {
      if (err instanceof ResourceNotFoundException || err.name === 'NotFound') {
        return false;
      } else {
        serverLogger.error({
          message:
            'Encountered error while checking for object existence in s3',
          errorData: err,
          bucket: this.bucket,
          key: key,
        });
        Sentry.captureException(err, { data: { bucket: this.bucket, key } });
        throw err;
      }
    }
  }
  /**
   * List all objects in a bucket for a given prefix,
   * paginating if the total number of objects exceeds
   * the maximum keys returned per request.
   * @param maxPageSize the maximum keys returned per request (mostly for testing)
   */
  async listAllObjects(
    prefix: string,
    maxPageSize?: number,
  ): Promise<Array<string>> {
    let isTruncated: boolean | undefined = true;
    let nextContinuationToken: string | undefined = undefined;
    const fileKeys: string[] = [];
    while (isTruncated === true) {
      try {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: nextContinuationToken,
          Prefix: prefix,
          MaxKeys: maxPageSize,
        });
        const response = await this.s3.send<ListObjectsV2Command>(command);
        const keys = response.Contents?.flatMap((f) =>
          f.Key != null ? [f.Key] : [],
        );
        if (keys != null) {
          fileKeys.push(...keys);
        }
        isTruncated = response.IsTruncated;
        nextContinuationToken = response.NextContinuationToken;
      } catch (error) {
        serverLogger.error({
          message: 'Error listing bucket objects',
          errorData: error,
          bucket: this.bucket,
          prefix,
        });
        Sentry.captureException(error, {
          data: {
            message: 'Error listing bucket objects',
            bucket: this.bucket,
            prefix,
          },
        });
        throw error;
      }
    }
    return fileKeys;
  }
}
