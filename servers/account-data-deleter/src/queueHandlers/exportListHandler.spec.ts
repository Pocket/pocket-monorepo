import { config } from '../config';
import { ListDataExportService } from '../dataService/listDataExportService';
import { ExportListHandler } from './exportListHandler';
import { EventEmitter } from 'node:stream';

describe('exportHandler', () => {
  const emitter = new EventEmitter();
  const exportListHandler = new ExportListHandler(emitter, false);
  beforeEach(() => jest.restoreAllMocks());
  afterAll(() => jest.restoreAllMocks());
  it('works for non-nested SQS messages', async () => {
    const message = {
      userId: '12345',
      requestId: '25be3f55',
      encodedId: '9324jdfazlsdfljk',
      cursor: 1186237110,
      part: 1,
    };
    const exportSpy = jest
      .spyOn(ListDataExportService.prototype, 'exportListChunk')
      .mockResolvedValue(true);
    await exportListHandler.handleMessage(message);
    expect(exportSpy).toHaveBeenCalledExactlyOnceWith(
      '25be3f55',
      1186237110,
      config.listExport.queryLimit,
      1,
    );
  });
});
