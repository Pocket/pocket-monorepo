import { config } from '../config';
import { ListDataExportService } from '../dataService/listDataExportService';
import { ExportListHandler } from './exportListHandler';
import { EventEmitter } from 'node:stream';
import * as Sentry from '@sentry/node';

describe('exportHandler', () => {
  const emitter = new EventEmitter();
  const exportListHandler = new ExportListHandler(emitter, false);
  let captureExceptionSpy: jest.SpyInstance;

  beforeEach(() => {
    captureExceptionSpy = jest
      .spyOn(Sentry, 'captureException')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('works for non-nested SQS messages', async () => {
    const message = {
      userId: '12345',
      requestId: '25be3f55',
      encodedId: '9324jdfazlsdfljk',
      cursor: 1186237110,
      part: 1,
    };
    const exportSpy = jest
      .spyOn(ListDataExportService.prototype, 'exportChunk')
      .mockResolvedValue(true);
    await exportListHandler.handleMessage(message);
    expect(exportSpy).toHaveBeenCalledExactlyOnceWith(
      '25be3f55',
      1186237110,
      config.listExport.queryLimit,
      1,
    );
  });

  it('sends a Sentry error when exportChunk fails', async () => {
    const message = {
      userId: '12345',
      requestId: '25be3f55',
      encodedId: '9324jdfazlsdfljk',
      cursor: 1186237110,
      part: 1,
    };

    const error = new Error('fail exportChunk');

    const exportSpy = jest
      .spyOn(ListDataExportService.prototype, 'exportChunk',)
      .mockRejectedValue(error);

    const result = await exportListHandler.handleMessage(message);

    expect(result).toBe(false);
    expect(exportSpy).toHaveBeenCalledExactlyOnceWith(
      '25be3f55',
      1186237110,
      config.listExport.queryLimit,
      1,
    );
    // check for Sentry error
    expect(captureExceptionSpy).toHaveBeenCalledTimes(1);
    expect(captureExceptionSpy).toHaveBeenCalledWith(error);
  });
});
