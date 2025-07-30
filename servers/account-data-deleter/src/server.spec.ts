import { serverLogger } from '@pocket-tools/ts-logger';

// Mock all dependencies before importing the module under test
jest.mock('./unleash', () => ({
  unleash: jest.fn(() => ({
    on: jest.fn(),
    start: jest.fn(),
    isEnabled: jest.fn(() => false),
  })),
}));

// Create mock queue handler classes with stop method
const createMockHandler = () => {
  const mockStop = jest.fn().mockResolvedValue(undefined);
  return jest.fn().mockImplementation(() => ({
    stop: mockStop,
  }));
};

const MockBatchDeleteHandler = createMockHandler();
const MockExportListHandler = createMockHandler();
const MockImportListHandler = createMockHandler();
const MockExportStateHandler = createMockHandler();
const MockExportAnnotationsHandler = createMockHandler();

jest.mock('./queueHandlers', () => ({
  BatchDeleteHandler: MockBatchDeleteHandler,
  ExportListHandler: MockExportListHandler,
  ImportListHandler: MockImportListHandler,
}));

jest.mock('./queueHandlers/exportStateHandler', () => ({
  ExportStateHandler: MockExportStateHandler,
}));

jest.mock('./queueHandlers/exportAnnotationsHandler', () => ({
  ExportAnnotationsHandler: MockExportAnnotationsHandler,
}));

// Now import the module under test
import { startServer, gracefulShutdown } from './server';

describe('gracefulShutdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Stub process.exit to prevent terminating the test runner
    jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`Process exit: ${code}`);
    });
    // Silence logger
    jest.spyOn(serverLogger, 'info').mockImplementation(() => serverLogger);
    jest.spyOn(serverLogger, 'error').mockImplementation(() => serverLogger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should close HTTP server, stop all queue handlers, log status, and exit process', async () => {
    // Start server on ephemeral port
    const { server } = await startServer(0);

    // Get instances of the handlers
    const handlers = [
      MockBatchDeleteHandler.mock.results[0].value,
      MockExportListHandler.mock.results[0].value,
      MockImportListHandler.mock.results[0].value,
      MockExportStateHandler.mock.results[0].value,
      MockExportAnnotationsHandler.mock.results[0].value,
    ];

    // Spy on server.close
    const closeSpy = jest.spyOn(server, 'close');

    let caughtError: Error | undefined;
    try {
      await gracefulShutdown('SIGTERM', server);
    } catch (err: any) {
      caughtError = err;
    }

    // Expect process.exit stub to have thrown
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError!.message).toBe('Process exit: 0');

    // HTTP server should have been closed
    expect(closeSpy).toHaveBeenCalled();

    // All five queue handlers should have been stopped
    handlers.forEach((handler) => {
      expect(handler.stop).toHaveBeenCalled();
    });

    // Logs for shutdown received and completion
    expect(serverLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Received SIGTERM'),
    );
    expect(serverLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('All queue handlers stopped successfully'),
    );

    // Ensure process.exit was called with code 0
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
