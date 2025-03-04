import { PocketEventBridgeClient } from '@pocket-tools/event-bridge';
import { AsyncDataExportService } from './AsyncDataExportService.ts';
import { S3Bucket } from './S3Bucket.ts';
import { SQS } from '@aws-sdk/client-sqs';

type ExportRecord = {
  cursor: number;
  text: string;
};

class ExportConcrete extends AsyncDataExportService<
  ExportRecord,
  ExportRecord
> {
  constructor(
    protected readonly user: {
      userId: number;
      encodedId: string;
    },
    protected readonly s3: {
      bucket: S3Bucket;
      partsPrefix: string;
    },
    protected readonly sqs: {
      workQueue: string;
      client: SQS;
    },
    protected readonly eventBridge: {
      client: PocketEventBridgeClient;
      source: string;
    },
  ) {
    super(user, s3, sqs, eventBridge);
  }

  get serviceName() {
    return 'list' as const;
  }

  fileKey(part: number): string {
    return `parts/${this.user.encodedId}/part_${part}`;
  }

  fetchData(from: number, size: number): Promise<Array<ExportRecord>> {
    return Promise.resolve([]);
  }

  formatExport(entries: ExportRecord[]) {
    return entries;
  }

  write(records: ExportRecord[], fileKey: string): Promise<void> {
    return Promise.resolve(undefined);
  }
}

describe('ListDataExportService', () => {
  const userId = 12345;
  const encodedId = '1a234d';
  const exporter = new ExportConcrete(
    { userId, encodedId },
    { bucket: new S3Bucket('bucket'), partsPrefix: 'parts' },
    { workQueue: 'us-east.sqs/placeholder', client: new SQS() },
    {
      client: new PocketEventBridgeClient({ eventBus: { name: 'default' } }),
      source: 'aws-utils',
    },
  );
  beforeEach(() => jest.restoreAllMocks());
  it('notifies that the request is finished if there is no data to export', async () => {
    jest.spyOn(exporter, 'fetchData').mockResolvedValue([]);
    const notifySpy = jest
      .spyOn(exporter, 'notifyComplete')
      .mockResolvedValue(undefined);
    await exporter.exportChunk('12345', -1, 100, 0);
    expect(notifySpy).toHaveBeenCalledExactlyOnceWith(
      '1a234d',
      '12345',
      'parts/1a234d',
    );
  });
  it('notifies that the request is finished if there is no more data left', async () => {
    const writeSpy = jest.spyOn(exporter, 'write');
    jest.spyOn(exporter, 'fetchData').mockResolvedValue([
      {
        cursor: 1,
        text: 'test',
      },
    ]);
    const notifySpy = jest
      .spyOn(exporter, 'notifyComplete')
      .mockResolvedValue(undefined);
    await exporter.exportChunk('12345', -1, 100, 0);
    expect(notifySpy).toHaveBeenCalledExactlyOnceWith(
      '1a234d',
      '12345',
      'parts/1a234d',
    );
    expect(writeSpy).toHaveBeenCalledOnce();
  });
  it('requests the next chunk using the cursor, incrementing the part', async () => {
    jest.spyOn(exporter, 'fetchData').mockResolvedValue([
      {
        cursor: 1,
        text: 'abc',
      },
      {
        cursor: 2,
        text: '123',
      },
    ]);
    const nextChunkSpy = jest
      .spyOn(exporter, 'requestNextChunk')
      .mockResolvedValue(undefined);
    await exporter.exportChunk('12345', -1, 1, 0);
    expect(nextChunkSpy).toHaveBeenCalledExactlyOnceWith('12345', 2, 1);
  });
  it('calls transform method prior to writing to csv', async () => {
    const writeSpy = jest.spyOn(exporter, 'write');
    jest.spyOn(exporter, 'fetchData').mockResolvedValue([
      {
        cursor: 1,
        text: 'abc',
      },
    ]);
    jest.spyOn(exporter, 'notifyComplete').mockResolvedValue(undefined);
    const formatter = jest.spyOn(exporter, 'formatExport');
    await exporter.exportChunk('12345', -1, 100, 0);
    expect(formatter).toHaveBeenCalledOnce();
    expect(formatter).toHaveBeenCalledBefore(writeSpy);
  });
});
