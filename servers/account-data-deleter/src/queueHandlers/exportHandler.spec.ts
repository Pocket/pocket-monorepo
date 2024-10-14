import { config } from '../config';
import { ListDataExportService } from '../dataService/listDataExportService';
import { ExportListHandler } from './exportHandler';
import { EventEmitter } from 'node:stream';

describe('exportHandler', () => {
  const emitter = new EventEmitter();
  const exportListHandler = new ExportListHandler(emitter, false);
  beforeEach(() => jest.restoreAllMocks());
  afterAll(() => jest.restoreAllMocks());
  it('returns signed url of available export if it exists', async () => {
    jest
      .spyOn(ListDataExportService.prototype, 'lastGoodExport')
      .mockResolvedValueOnce('http://export.zip');
    const notifySpy = jest
      .spyOn(ListDataExportService.prototype, 'notifyUser')
      .mockResolvedValue();
    await exportListHandler.handleMessage({
      Message: JSON.stringify({
        detail: {
          requestId: 'abc123',
          userId: 12345,
          encodedId: '12345a',
          cursor: -1,
          part: 0,
        },
      }),
    });
    expect(notifySpy).toHaveBeenCalledExactlyOnceWith(
      '12345a',
      'abc123',
      'http://export.zip',
    );
  });
  it('kicks off export process if no export exists', async () => {
    jest
      .spyOn(ListDataExportService.prototype, 'lastGoodExport')
      .mockResolvedValueOnce(false);
    const exportSpy = jest
      .spyOn(ListDataExportService.prototype, 'exportListChunk')
      .mockResolvedValue();
    await exportListHandler.handleMessage({
      Message: JSON.stringify({
        detail: {
          requestId: 'abc123',
          userId: 12345,
          encodedId: '12345a',
          cursor: -1,
          part: 0,
        },
      }),
    });
    expect(exportSpy).toHaveBeenCalledExactlyOnceWith(
      'abc123',
      -1,
      config.listExport.queryLimit,
      0,
    );
  });
});
