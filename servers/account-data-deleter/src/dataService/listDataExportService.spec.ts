import { eventBridgeClient, readClient } from './clients';
import { ListDataExportService } from './listDataExportService';
import { S3Bucket } from './s3Service';

describe('ListDataExportService', () => {
  const exporter = new ListDataExportService(
    1234,
    '1a234d',
    readClient(),
    new S3Bucket('bucket'),
    eventBridgeClient(),
  );
  beforeEach(() => jest.restoreAllMocks());
  it('notifies that the request is finished if there is no data to export', async () => {
    jest.spyOn(exporter, 'fetchListData').mockResolvedValue([]);
    const notifySpy = jest
      .spyOn(exporter, 'notifyUser')
      .mockResolvedValue(undefined);
    await exporter.exportListChunk('12345', -1, 100, 0);
    expect(notifySpy).toHaveBeenCalledExactlyOnceWith('1a234d', '12345');
  });
  it('notifies that the request is finished if there is no more data left', async () => {
    jest.spyOn(exporter, 'fetchListData').mockResolvedValue([
      {
        cursor: 1,
        tags: '',
        time_added: 12345,
        url: 'http://',
        title: 'never',
      },
    ]);
    jest.spyOn(S3Bucket.prototype, 'zipFilesByPrefix').mockResolvedValue({
      Key: '/archive/export.zip',
      Bucket: 'export-bucket',
    });
    jest
      .spyOn(S3Bucket.prototype, 'getSignedUrl')
      .mockResolvedValue('http://your-archive.zip');
    const notifySpy = jest
      .spyOn(exporter, 'notifyUser')
      .mockResolvedValue(undefined);
    await exporter.exportListChunk('12345', -1, 100, 0);
    expect(notifySpy).toHaveBeenCalledExactlyOnceWith(
      '1a234d',
      '12345',
      'http://your-archive.zip',
    );
  });
  it('requests the next chunk using the cursor, incrementing the part', async () => {
    jest.spyOn(exporter, 'fetchListData').mockResolvedValue([
      {
        cursor: 1,
        tags: '',
        time_added: 12345,
        url: 'http://',
        title: 'never',
      },
      {
        cursor: 2,
        tags: '',
        time_added: 12345,
        url: 'http://',
        title: 'never',
      },
    ]);
    jest.spyOn(S3Bucket.prototype, 'writeCsv').mockResolvedValue(true);
    const nextChunkSpy = jest
      .spyOn(exporter, 'requestNextChunk')
      .mockResolvedValue(undefined);
    await exporter.exportListChunk('12345', -1, 1, 0);
    expect(nextChunkSpy).toHaveBeenCalledExactlyOnceWith('12345', 2, 1);
  });
});
