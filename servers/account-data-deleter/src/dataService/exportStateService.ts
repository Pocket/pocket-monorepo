import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { serverLogger } from '@pocket-tools/ts-logger';
import { type S3Bucket } from '@pocket-tools/aws-utils';
import { config } from '../config';
import { sqs } from '../aws/sqs';
import { ExportMessage } from '../types';
import path from 'path';
import * as Sentry from '@sentry/node';
import {
  ExportPartComplete,
  ExportReady,
  ExportRequested,
  PocketEventBridgeClient,
  PocketEventType,
} from '@pocket-tools/event-bridge';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

type ExportService = ExportPartComplete['detail']['service'];

type ExportRequestRecord = {
  requestId: string;
  expiresAt: string;
  createdAt: string;
} & Partial<Record<ExportService, boolean>>;

export class ExportStateService {
  constructor(
    private readonly eventBridge: PocketEventBridgeClient,
    private readonly exportBucket: S3Bucket,
    private readonly dynamo: DynamoDBDocumentClient,
  ) {}

  /**
   * Naming scheme for export archive file
   */
  private zipFileKey(encodedId: string): string {
    return path.join(config.listExport.archivePrefix, encodedId, 'pocket.zip');
  }

  async processUpdate(payload: ExportPartComplete) {
    serverLogger.info({
      message: 'ExportListHandler - Processing Status update',
      body: payload,
    });
    const result = await this.updateStatus(payload);
    serverLogger.info({
      message: 'ExportListHandler - Status update result',
      body: result,
    });
    if (result != null && (await this.isComplete(result))) {
      const signedUrl = await this.getExportUrl(
        payload.detail.prefix,
        payload.detail.encodedId,
      );
      await this.notifyUser(
        payload.detail.encodedId,
        payload.detail.requestId,
        signedUrl,
      );
    }
  }

  // Compile and send notification for export
  async getExportUrl(
    prefix: string,
    encodedId: string,
  ): Promise<string | undefined> {
    const zipResponse = await this.exportBucket.zipFilesByPrefix(
      prefix,
      this.zipFileKey(encodedId),
    );
    if (zipResponse != null) {
      const { Key: zipKey } = zipResponse;
      const signedUrl = await this.exportBucket.getSignedUrl(
        zipKey,
        config.listExport.signedUrlExpiry,
      );
      return signedUrl;
    }
  }

  // Emit an event to event bridge to notify user
  async notifyUser(encodedId: string, requestId: string, signedUrl?: string) {
    const payload: ExportReady = {
      'detail-type': PocketEventType.EXPORT_READY,
      source: 'account-data-deleter',
      detail: {
        encodedId,
        requestId,
        archiveUrl: signedUrl,
      },
    };

    try {
      await this.eventBridge.sendPocketEvent(payload);
    } catch (err) {
      serverLogger.error({
        message: 'Error sending list-export-ready event',
        errorData: err,
        payload,
      });
      Sentry.captureException(err, { data: { payload } });
      // Re-throw for calling function
      throw err;
    }
  }
  // Returns true if all parts are complete, false otherwise
  async isComplete(record: ExportRequestRecord): Promise<boolean> {
    // Re-request with consistent read, as even though
    // update results are documented to be strongly
    // consistent it doesn't actually seem to be
    const current = await this.dynamo.send(
      new GetCommand({
        ConsistentRead: true,
        TableName: config.listExport.dynamoTable,
        Key: {
          requestId: record.requestId,
        },
      }),
    );
    // No runtime types... some type safety
    const serviceMap: Record<ExportService, null> = {
      list: null,
      annotations: null,
      'shareable-lists': null,
    };
    const services = (Object.keys(serviceMap) as ExportService[]).map((_) =>
      // Strip illegal character
      _.replace('-', ''),
    );
    for (const service in services) {
      if (current[service] !== true) {
        return false;
      } else {
        continue;
      }
    }
    return true;
  }

  // TODO: handle thrown errors (don't delete message)
  // after it's started, the individual queue pollers will
  // handle the rest
  async startExport(payload: ExportRequested): Promise<true> {
    const cachedExport = await this.lastGoodExport(payload.detail.encodedId);
    if (cachedExport) {
      serverLogger.info({
        message: 'ExportListHandler - Found valid export',
        export: cachedExport,
      });
      this.notifyUser(
        payload.detail.encodedId,
        payload.detail.requestId,
        cachedExport,
      );
    }
    await this.updateStatus(payload);
    await this.putExportMessage(payload, config.aws.sqs.listExportQueue.url);
    await this.putExportMessage(
      payload,
      config.aws.sqs.anotationsExportQueue.url,
    );
    return true;
  }

  async putExportMessage(payload: ExportRequested, queueUrl: string) {
    const body: ExportMessage = {
      userId: payload.detail.userId.toString(),
      requestId: payload.detail.requestId,
      encodedId: payload.detail.encodedId,
      cursor: payload.detail.cursor,
      part: payload.detail.part,
    };
    const command = new SendMessageCommand({
      MessageBody: JSON.stringify(body),
      QueueUrl: queueUrl,
    });
    await sqs.send(command);
    return;
  }

  /**
   * Update the status of an export request in dynamodb
   * @param payload
   * @returns updated attributes, or undefined if the update failed without error
   */
  async updateStatus(
    payload: ExportPartComplete | ExportRequested,
  ): Promise<ExportRequestRecord | undefined> {
    const now = new Date();
    if (payload['detail-type'] === PocketEventType.EXPORT_REQUESTED) {
      const input = {
        // Create new export request record
        TableName: config.listExport.dynamoTable,
        Key: {
          requestId: payload.detail.requestId,
        },
        UpdateExpression: `SET expiresAt = :ea, createdAt = :ca`,
        ExpressionAttributeValues: {
          ':ea': Math.floor(now.getTime() / 1000) + 60 * 60 * 24 * 17, // 17 days (longer than parts retention),
          ':ca': now.toISOString(),
        },
        ReturnValues: 'ALL_NEW' as const,
      };
      const result = await this.dynamo.send(new UpdateCommand(input));
      return result.Attributes as ExportRequestRecord;
    }
    // Update the status of the export request to reflect
    // completed compontents
    // Remove illegal character
    const service = payload.detail.service.replace('-', '');
    const input = {
      TableName: config.listExport.dynamoTable,
      Key: {
        requestId: payload.detail.requestId,
      },
      ExpressionAttributeNames: { '#ss': service },
      UpdateExpression: `SET #ss = :ss, ${service}CompletedAt = :sca`,
      ExpressionAttributeValues: {
        ':ss': true,
        ':sca': payload.detail.timestamp,
      },
      ReturnValues: 'ALL_NEW' as const,
    };
    const result = await this.dynamo.send(new UpdateCommand(input));
    return result.Attributes as ExportRequestRecord;
  }

  /**
   * Return the signedUrl of an unexpired export for a User
   * (if it exists, false otherwise)
   */
  async lastGoodExport(encodedId: string): Promise<string | false> {
    const exists = await this.exportBucket.objectExists(
      this.zipFileKey(encodedId),
    );
    if (exists) {
      return await this.exportBucket.getSignedUrl(
        this.zipFileKey(encodedId),
        config.listExport.signedUrlExpiry,
        config.listExport.presignedIamUserCredentials,
      );
    } else {
      return false;
    }
  }
}
