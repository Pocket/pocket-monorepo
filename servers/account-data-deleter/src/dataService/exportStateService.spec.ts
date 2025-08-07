import * as Sentry from '@sentry/node';
import { ExportStateService } from './exportStateService';
import { PocketEventType } from '@pocket-tools/event-bridge';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from '../config';

describe('export state service', () => {
  let captureSentryExceptionSpy: jest.SpyInstance;
  let addSentryBreadcrumbSpy: jest.SpyInstance;


  beforeEach(() => {
    captureSentryExceptionSpy = jest
      .spyOn(Sentry, 'captureException')
      .mockImplementation();

    addSentryBreadcrumbSpy = jest
      .spyOn(Sentry, 'addBreadcrumb')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('isComplete() marks complete when all services are true', () => {
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

  it('getExportUrl() - sends Sentry error when zip export fails', async () => {
    // Mock S3 export bucket
    const mockExportBucket = {
      zipFilesByPrefix: jest.fn().mockResolvedValue(null), // create a mock failure
    };
    // Mock event bridge
    const mockEventBridge = {
      sendPocketEvent: jest.fn(),
    };

    // Mock ExportStateService
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
    expect(captureSentryExceptionSpy).toHaveBeenCalledTimes(1);
    // 2 Sentry breadcrumbs should be added
    expect(addSentryBreadcrumbSpy).toHaveBeenCalledTimes(2);
  });

  it('getExportUrl() - passes IAM credentials to getSignedUrl when creating export URL', async () => {
    const mockZipKey = 'archives/user123/pocket.zip';
    const mockSignedUrl = 'https://s3.amazonaws.com/bucket/file?signed=true';

    // Mock S3 export bucket
    const mockExportBucket = {
      zipFilesByPrefix: jest.fn().mockResolvedValue({ Key: mockZipKey }),
      getSignedUrl: jest.fn().mockResolvedValue(mockSignedUrl),
    };

    // Mock event bridge
    const mockEventBridge = {
      sendPocketEvent: jest.fn(),
    };

    // Create ExportStateService instance
    const exportStateService = new ExportStateService(
      mockEventBridge as any,
      mockExportBucket as any,
      {} as DynamoDBDocumentClient,
    );

    // Call getExportUrl
    const result = await exportStateService.getExportUrl('prefix/user123', 'encoded123');

    // Verify the signed URL is returned
    expect(result).toBe(mockSignedUrl);

    // Verify zipFilesByPrefix was called with correct parameters
    expect(mockExportBucket.zipFilesByPrefix).toHaveBeenCalledWith(
      'prefix/user123',
      'archives/encoded123/pocket.zip',
    );

    // Verify getSignedUrl was called with all three parameters including credentials
    expect(mockExportBucket.getSignedUrl).toHaveBeenCalledWith(
      mockZipKey,
      config.listExport.signedUrlExpiry,
      config.listExport.presignedIamUserCredentials,
    );
  });

  it('notifyUser() - should NOT capture Sentry error directly when sending notification fails but should add Sentry breadcrumb', async () => {
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
    // Sentry exception should NOT be thrown
    expect(captureSentryExceptionSpy).not.toHaveBeenCalled();
    // 1 Sentry breadcrumb should be added
    expect(addSentryBreadcrumbSpy).toHaveBeenCalledTimes(1);
  });

  it('startExport() - sends a Sentry error when notifyUser() call fails', async () => {
    const mockExportBucket = {
      objectExists: jest.fn().mockResolvedValue(true),
      getSignedUrl: jest.fn().mockResolvedValue('https://example.com'),
    };

    const mockEventBridge = {
      sendPocketEvent: jest.fn().mockRejectedValue(new Error('sendPocket event called from notifyUser: Mock EventBridge failure')),
    };

    const mockExportStateService = new ExportStateService(
      mockEventBridge as any,
      mockExportBucket as any,
      {} as any,
    );

    const payload = {
      'detail-type': PocketEventType.EXPORT_REQUESTED,
      detail: {
        encodedId: 'encoded-id',
        requestId: 'abc-123',
        userId: 123,
      },
    };

    const notifyUserSpy = jest.spyOn(mockExportStateService, 'notifyUser');
    
    await expect(mockExportStateService.startExport(payload as any)).rejects.toThrow(
      'sendPocket event called from notifyUser: Mock EventBridge failure',
    );

    expect(notifyUserSpy).toHaveBeenCalledWith(
      'encoded-id',
      'abc-123',
      'https://example.com',
    );

    expect(captureSentryExceptionSpy).toHaveBeenCalledTimes(1);
    // 2 Sentry breadcrumb should be added
    // 1 from startExport() & 1 from notifyUser
    expect(addSentryBreadcrumbSpy).toHaveBeenCalledTimes(2);
    // Check for correct breadcrumb messages
    const breadcrumbMessages = addSentryBreadcrumbSpy.mock.calls.map(([arg]) => arg.message);
    expect(breadcrumbMessages).toContain('ExportStateService - notifyUser - Failed to send EventBridge notification');
    expect(breadcrumbMessages).toContain('ExportStateService - startExport - notifyUser call failed');
  });


  it('startExport() - sends a Sentry error when putExportMessage() call fails', async () => {
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
    jest.spyOn(mockExportStateService, 'putExportMessage').mockRejectedValue(new Error('Mock putExportMessage failure - adding export messages to queues failed'));

    const payload = {
      'detail-type': PocketEventType.EXPORT_REQUESTED,
      detail: {
        encodedId: 'abc',
        requestId: 'abc-123',
        userId: 123,
      },
    };

    await expect(mockExportStateService.startExport(payload as any)).rejects.toThrow('Mock putExportMessage failure - adding export messages to queues failed');
    // Check putExportMessage was called
    expect(mockExportStateService.putExportMessage).toHaveBeenCalled();
    // Check for Sentry error
    expect(captureSentryExceptionSpy).toHaveBeenCalledTimes(1);
    // 1 Sentry breadcrumb should be added
    expect(addSentryBreadcrumbSpy).toHaveBeenCalledTimes(1);
    // Check for correct breadcrumb message
    const [sentryBreadcrumb] = addSentryBreadcrumbSpy.mock.calls[0];
    expect(sentryBreadcrumb.message).toEqual(
      'ExportStateService - startExport - Adding export messages to list & annotations queues',
    );
  });

  it('updateStatus() - sends a Sentry error when creating an export record in Dynamo fails', async () => {
    const mockDynamo = {
      send: jest.fn().mockRejectedValue(new Error('Dynamo error - create export record failed')),
    };
    const mockExportStateService = new ExportStateService({} as any, {} as any, mockDynamo as any);

    const payload = {
      'detail-type': PocketEventType.EXPORT_REQUESTED,
      detail: {
        requestId: 'abc-123',
        service: 'list',
      },
    };

    await expect(mockExportStateService.updateStatus(payload as any)).rejects.toThrow('Dynamo error - create export record failed');
    expect(mockDynamo.send).toHaveBeenCalled();
    // Check for Sentry error
    expect(captureSentryExceptionSpy).toHaveBeenCalledTimes(1);
    // 1 Sentry breadcrumb should be added
    expect(addSentryBreadcrumbSpy).toHaveBeenCalledTimes(1);
    // Check for create export record breadcrumb
    const [sentryBreadcrumb] = addSentryBreadcrumbSpy.mock.calls[0];
    expect(sentryBreadcrumb.message).toEqual(
      'ExportStateService - updateStatus - Dynamo error: failed to create new export record',
    );
    expect(sentryBreadcrumb.data).toEqual({ requestId: 'abc-123' });
  });

  it('updateStatus() - sends a Sentry error when updating status of export record in Dynamo fails', async () => {
    const mockDynamo = {
      send: jest.fn().mockRejectedValue(new Error('Dynamo error - update status of export record failed')),
    };
    const mockExportStateService = new ExportStateService({} as any, {} as any, mockDynamo as any);

    const payload = {
      'detail-type': PocketEventType.EXPORT_PART_COMPLETE,
      detail: {
        requestId: 'abc-123',
        service: 'list',
      },
    };

    await expect(mockExportStateService.updateStatus(payload as any)).rejects.toThrow('Dynamo error - update status of export record failed');
    expect(mockDynamo.send).toHaveBeenCalled();
    // Check for Sentry error
    expect(captureSentryExceptionSpy).toHaveBeenCalledTimes(1);
    // 1 Sentry breadcrumb should be added
    expect(addSentryBreadcrumbSpy).toHaveBeenCalledTimes(1);
    // Check for update status breadcrumb
    const [sentryBreadcrumb] = addSentryBreadcrumbSpy.mock.calls[0];
    expect(sentryBreadcrumb.message).toEqual(
      'ExportStateService - updateStatus - Dynamo error: failed to update status of export record',
    );
    expect(sentryBreadcrumb.data).toEqual({ requestId: 'abc-123' });
  });
});
