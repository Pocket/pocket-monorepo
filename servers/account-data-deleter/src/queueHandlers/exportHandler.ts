import { EventEmitter } from 'events';
import { config } from '../config';
import { ExportMessage } from '../types';
import { eventBridgeClient, readClient } from '../dataService/clients';
import { type Unleash } from 'unleash-client';
import { QueueHandler } from './queueHandler';
import { ListDataExportService } from '../dataService/listDataExportService';
import { S3Bucket } from '../dataService/s3Service';
import { serverLogger } from '@pocket-tools/ts-logger';

export class ExportListHandler extends QueueHandler {
  /**
   * Class for exporting a Pocket User's list in batches from the
   * database, when a user makes an export request.
   * when a user deletes their account. Consumes messages from
   * the ExportList SQS queue in a synchronous, blocking way;
   * only picks up a new message when the previous one has been
   * completed (or had error), after a delay. If not actively
   * processing messages, polls the queue on a schedule to discover
   * messages.
   * Queue polling starts by deafult
   * once the class is instantiated and continues
   * on a schedule.
   * @param emitter The EventEmitter used by the class for scheduling
   * poll events
   * @param pollOnInit whether to start polling when the class is
   * instantiated, primarily for testing (default=true);
   * @param unleashClient optional unleash client, intended
   * to use mock for testing. Otherwise will pull in the globally
   * initialized unleash instance. Can consider DI here and elsewhere
   * in the future.
   */
  constructor(
    public readonly emitter: EventEmitter,
    pollOnInit = true,
    unleashClient?: Unleash,
  ) {
    super(
      emitter,
      'pollListExport',
      config.aws.sqs.exportQueue,
      pollOnInit,
      unleashClient,
    );
  }

  /**
   * Handle messages from the ListExport queue.
   * @param body the body of the SQS message in the ListExport queue,
   * which is actually JSON-stringified body of another message...
   * @returns whether or not the message was successfully handled
   * (underlying call to AccountDeleteDataService completed without error)
   */
  async handleMessage(
    message: { Message: string } | ExportMessage,
  ): Promise<boolean> {
    serverLogger.info({
      message: 'ExportListHandler - received request',
      body: message,
    });
    try {
      let body: ExportMessage;
      // The initial message is nested in layers of SNS/SQS overhead
      if ('Message' in message && message.Message != null) {
        body = JSON.parse(message.Message)['detail'];
        // Subsequent chunk requests do not have those layers
        // and can be parsed directly
      } else if ('cursor' in message) {
        body = message;
      } else {
        throw new Error('Invalid message body');
      }
      const exportBucket = new S3Bucket(config.listExport.exportBucket);
      const exportService = new ListDataExportService(
        parseInt(body.userId),
        body.encodedId,
        readClient(),
        exportBucket,
        eventBridgeClient(),
      );
      // First check if there is an unexpired export
      const lastGoodExport = await exportService.lastGoodExport();
      if (lastGoodExport) {
        serverLogger.info({
          message: 'ExportListHandler - Found valid export',
          export: lastGoodExport,
        });
        exportService.notifyUser(
          body.encodedId,
          body.requestId,
          lastGoodExport,
        );
      } else {
        serverLogger.info({
          message: 'ExportListHandler - Exporting list data',
          requestId: body.requestId,
          cursor: body.cursor,
          part: body.part,
        });
        // If not, then kick off the export process
        await exportService.exportListChunk(
          body.requestId,
          body.cursor,
          config.listExport.queryLimit,
          body.part,
        );
      }
    } catch (error) {
      serverLogger.error({
        message:
          'Error encountered while handling export. Returning message to the queue',
        errorData: error,
        request: message,
        errorMessage: error.message,
      });
      // Underlying services handle logging and observability of their errors
      return false;
    }
    return true;
  }
}