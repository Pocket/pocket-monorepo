import * as Sentry from '@sentry/node';
import { ExportStateService } from './exportStateService';
import { PocketEventType } from '@pocket-tools/event-bridge';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

describe('export state service', () => {
  let captureExceptionSpy: jest.SpyInstance;

  beforeEach(() => {
    captureExceptionSpy = jest
      .spyOn(Sentry, 'captureException')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks complete when all services are true', () => {
    const input = {
      annotations: true,
      annotationsCompletedAt: '2025-03-06T18:55:14.368Z',
      createdAt: '2025-03-06T18:54:11.954Z',
      expiresAt: 1742756051,
      list: true,
      listCompletedAt: '2025-03-06T18:55:14.410Z',
      requestId: '89d183ad-0957-45ef-ae2e-018476f8c61c',
      shareablelists: true,
      shareablelistsCompletedAt: '2025-03-06T18:54:19.183Z',
    };
    expect(ExportStateService.isComplete(input)).toBeTrue();
  });

  it('getExportUrl - sendS Sentry error when zip export fails', async () => {
    // Mock S3 export bucket
    const mockExportBucket = {
      zipFilesByPrefix: jest.fn().mockResolvedValue(null), // create a mock failure
    };
    // Mock event bridge
    const mockEventBridge = {
      sendPocketEvent: jest.fn(),
    };

    const mockExportStateService = new ExportStateService(
      mockEventBridge as any,
      mockExportBucket as any,
      {} as DynamoDBDocumentClient,
    );


    await expect(mockExportStateService.getExportUrl('p', 'abc-123')).rejects.toThrow(
      'ExportStateService - getExportUrl - Failed to zip export files',
    );
    // Check zipFilesByPrefix was called
    expect(mockExportBucket.zipFilesByPrefix).toHaveBeenCalled();
    // Check for Sentry error
    expect(captureExceptionSpy).toHaveBeenCalled();
  });

  it('notifyUser - sends a Sentry error when sending notification fails', async () => {
    // Mock event bridge
    const mockEventBridge = {
      sendPocketEvent: jest.fn().mockRejectedValue(new Error('Failed to send EventBridge notification')),
    };
    const mockExportStateService = new ExportStateService(mockEventBridge as any, {} as any, {} as any);

    await expect(
      mockExportStateService.notifyUser('encoded-id', 'abc-123', 'https://example.com'),
    ).rejects.toThrow('Failed to send EventBridge notification');

    // Check sendPocketEvent was called
    expect(mockEventBridge.sendPocketEvent).toHaveBeenCalled();
    // Check for Sentry error
    expect(captureExceptionSpy).toHaveBeenCalled();
  });

  it('startExport - sends a Sentry error when putExportMessage call fails', async () => {
    const mockExportBucket = {
      objectExists: jest.fn().mockResolvedValue(false),
    };

    const mockExportStateService = new ExportStateService(
      { sendPocketEvent: jest.fn() } as any,
      mockExportBucket as any,
      {} as any,
    );

    jest.spyOn(mockExportStateService, 'updateStatus').mockResolvedValue({
      requestId: 'abc-123',
      createdAt: new Date().toISOString(),
      expiresAt: (Date.now() / 1000) + 1000,
    });
    jest.spyOn(mockExportStateService, 'putExportMessage').mockRejectedValue(new Error('Adding export messages to queues failed'));

    const payload = {
      'detail-type': PocketEventType.EXPORT_REQUESTED,
      detail: {
        encodedId: 'abc',
        requestId: 'abc-123',
        userId: 123,
      },
    };

    await expect(mockExportStateService.startExport(payload as any)).rejects.toThrow('Adding export messages to queues failed');
    // Check putExportMessage was called
    expect(mockExportStateService.putExportMessage).toHaveBeenCalled();
    // Check for Sentry error
    expect(captureExceptionSpy).toHaveBeenCalled();
  });

  it('updateStatus - sends a Sentry error when updating export status in Dynamo fails', async () => {
    const mockDynamo = {
      send: jest.fn().mockRejectedValue(new Error('Dynamo error')),
    };
    const mockExportStateService = new ExportStateService({} as any, {} as any, mockDynamo as any);

    const payload = {
      'detail-type': PocketEventType.EXPORT_PART_COMPLETE,
      detail: {
        requestId: 'abc-123',
        service: 'list',
      },
    };

    await expect(mockExportStateService.updateStatus(payload as any)).rejects.toThrow('Dynamo error');
    // Check for Sentry error
    expect(captureExceptionSpy).toHaveBeenCalled();
  });
});
