import { handlerFn } from './index';
import { SQSEvent } from 'aws-lambda';
import { serverLogger } from '@pocket-tools/ts-logger';

describe('event handlers', () => {
  let serverLoggerStub: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    serverLoggerStub = jest.spyOn(serverLogger, 'info');
  });
  afterAll(() => jest.restoreAllMocks());

  it('logs the event', async () => {
    const records = {
      Records: [
        {
          body: JSON.stringify({
            Message: JSON.stringify({
              'detail-type': 'An event!',
              detail: { data: 'some data' },
            }),
          }),
        },
      ],
    };
    await handlerFn(records as SQSEvent);
    expect(serverLoggerStub).toHaveBeenCalledTimes(1);
    expect(serverLoggerStub).toHaveBeenCalledWith('Event received', {
      'detail-type': 'An event!',
      detail: { data: 'some data' },
    });
  });
});
