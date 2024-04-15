import { createLogger, setLogger } from './logger';

const defaultEnvs = process.env;

describe('createLogger', () => {
  const logger = createLogger();
  const loggerInfoSpy = jest.spyOn(logger, 'info');

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...defaultEnvs };
  });

  afterEach(() => {
    process.env = defaultEnvs;
    jest.resetAllMocks();
  });

  it('Local environment does not write to file', async () => {
    process.env.NODE_ENV = 'development';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createLogger = require('./logger').createLogger;

    const testLogger = createLogger();
    expect(testLogger.transports.length).toEqual(1);
    expect(testLogger.transports[0].name).toBe('console');
  });
  it('Test environment writes to files only', async () => {
    process.env.NODE_ENV = 'test';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createLogger = require('./logger').createLogger;

    const testLogger = createLogger();
    expect(testLogger.transports.length).toEqual(2);
    expect(testLogger.transports[0].name).toBe('file');
    expect(testLogger.transports[0].filename).toBe('error.log');
    expect(testLogger.transports[1].name).toBe('file');
    expect(testLogger.transports[1].filename).toBe('all.log');
  });

  it('Dev environment does not write to file', async () => {
    process.env.NODE_ENV = 'development';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createLogger = require('./logger').createLogger;

    const testLogger = createLogger();
    expect(testLogger.transports.length).toEqual(1);
    expect(testLogger.transports[0].name).toBe('console');
  });

  describe('level', () => {
    it('level is LOG_LEVEL when LOG_LEVEL is defined', () => {
      process.env.LOG_LEVEL = 'debug';
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const logger = require('./logger').createLogger();
      expect(logger.level).toEqual('debug');
    });

    describe('when env LOG_LEVEL is undefined', () => {
      beforeEach(() => () => {
        delete process.env.LOG_LEVEL;
      });

      it('level is debug when NODE_ENV is development', async () => {
        process.env.NODE_ENV = 'development';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const createLogger = require('./logger').createLogger;

        const testLogger = createLogger();
        expect(testLogger.level).toBe('debug');
      });

      it('level is info when NODE_ENV is not in (local, development)', async () => {
        const testLogger = createLogger();
        expect(testLogger.level).toBe('info');
      });

      it('level is debug when NODE_ENV is local ', async () => {
        process.env.NODE_ENV = 'local';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const createLogger = require('./logger').createLogger;

        const testLogger = createLogger();
        expect(testLogger.level).toBe('debug');
      });
    });
  });

  it('Non-dev and non-local do not write to file', async () => {
    process.env.NODE_ENV = 'production';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createLogger = require('./logger').createLogger;

    const testLogger = createLogger();
    expect(testLogger.transports.length).toEqual(1);
    expect(testLogger.transports[0].name).toBe('console');
  });

  it('Logger has release SHA when present, null otherwise', async () => {
    logger.info('test');
    expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
    expect(logger.defaultMeta).toHaveProperty('releaseSha');
    expect(logger.defaultMeta.releaseSha).toBeNull();

    process.env.RELEASE_SHA = '12345678910';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createLogger = require('./logger').createLogger;
    const testLogger = createLogger();
    testLogger.info('test');
    expect(testLogger.defaultMeta).toHaveProperty('releaseSha');
    expect(testLogger.defaultMeta.releaseSha).toBe('12345678910');
  });

  it('has a null release sha when RELEASE_SHA is null', () => {
    logger.info('test');
    expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
    expect(logger.defaultMeta).toHaveProperty('releaseSha');
    expect(logger.defaultMeta.releaseSha).toBeNull();
  });

  it('has a release sha when RELEASE_SHA is not null', () => {
    process.env.RELEASE_SHA = '12345678910';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createLogger = require('./logger').createLogger;
    const testLogger = createLogger();
    testLogger.info('test');
    expect(testLogger.defaultMeta).toHaveProperty('releaseSha');
    expect(testLogger.defaultMeta.releaseSha).toBe('12345678910');
  });

  it('adds additional default metadata', () => {
    const moreMeta = {
      extra: 'fields',
    };
    const testLogger = createLogger({ defaultMeta: moreMeta });
    expect(testLogger.defaultMeta).toHaveProperty('releaseSha');
    expect(testLogger.defaultMeta.releaseSha).toBeNull();
    expect(testLogger.defaultMeta).toHaveProperty('extra');
    expect(testLogger.defaultMeta.extra).toBe('fields');
  });

  it('supports deprecated setLogger interface', () => {
    const moreMeta = {
      extra: 'fields',
    };
    const testLogger = setLogger(moreMeta);
    expect(testLogger.defaultMeta).toHaveProperty('releaseSha');
    expect(testLogger.defaultMeta.releaseSha).toBeNull();
    expect(testLogger.defaultMeta).toHaveProperty('extra');
    expect(testLogger.defaultMeta.extra).toBe('fields');
  });
});
