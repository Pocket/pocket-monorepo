import { eventBridgeClient, readClient } from './clients';
import { ListDataExportService } from './listDataExportService';
import { S3Bucket } from '@pocket-tools/aws-utils';
import { config } from '../config';

describe('ListDataExportService', () => {
  const exporter = new ListDataExportService(
    1234,
    '1a234d',
    readClient(),
    new S3Bucket('bucket', {
      region: config.aws.region,
      endpoint: config.aws.endpoint,
    }),
    eventBridgeClient(),
  );
  beforeEach(() => jest.restoreAllMocks());
  it('transforms data prior to writing to csv', async () => {
    const writeSpy = jest
      .spyOn(S3Bucket.prototype, 'writeCsv')
      .mockResolvedValue(true);
    jest.spyOn(exporter, 'fetchData').mockResolvedValue([
      {
        cursor: 1,
        tags: '',
        time_added: 12345,
        url: 'http://',
        title: 'never',
        status: 'archive',
      },
    ]);
    jest.spyOn(exporter, 'notifyComplete').mockResolvedValue(undefined);
    await exporter.exportChunk('12345', -1, 100, 0);
    expect(writeSpy).toHaveBeenCalledExactlyOnceWith(
      [
        {
          tags: '',
          time_added: 12345,
          url: 'http://',
          title: 'never',
          status: 'archive',
        },
      ],
      // Also tests proper key
      'parts/1a234d/part_000000',
    );
  });
});
