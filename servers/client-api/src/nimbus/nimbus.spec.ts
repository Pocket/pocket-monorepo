import { NimbusServer } from './nimbus';
import nock from 'nock';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

describe('nimbus server constructor', () => {
  it('inits correctly with a full host', () => {
    const host = 'https://localhost:5000';
    const nimbus: NimbusServer = new NimbusServer(host);
    expect(nimbus.url.hostname).toEqual('localhost');
    expect(nimbus.url.protocol).toEqual('https:');
    expect(nimbus.url.port).toEqual('5000');
  });

  it('uses the default protocol (http) when not included', () => {
    const host = 'localhost:5000';
    const nimbus: NimbusServer = new NimbusServer(host);
    expect(nimbus.url.hostname).toEqual('localhost');
    expect(nimbus.url.protocol).toEqual(NimbusServer.DEFAULT_PROTOCOL);
    expect(nimbus.url.port).toEqual('5000');
  });

  it('throws an error if port is not specified', () => {
    const host = 'localhost';
    let logMessage: string;
    console.error = jest.fn((...args: string[]) => {
      logMessage = args[0];
    });
    expect(() => {
      new NimbusServer(host);
    }).toThrow(TypeError);
    expect(console.error).toHaveBeenCalled();
    expect(logMessage).toMatch('Error');
  });

  it('throws an error if an invalid url is passed', () => {
    const host = 'xy4tys22:::///localhost';
    let logMessage: string;
    console.error = jest.fn((...args: string[]) => {
      logMessage = args[0];
    });
    expect(() => {
      new NimbusServer(host);
    }).toThrow('Invalid URL');
    expect(console.error).toHaveBeenCalled();
    expect(logMessage).toMatch('Error');
  });
});

describe('Verify Nimbus healthcheck', () => {
  let nimbus: NimbusServer;
  let mockRequest;

  beforeEach(() => {
    nimbus = new NimbusServer('localhost:6633');
    mockRequest = nock('http://localhost:6633');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('returns true when the server is alive', async () => {
    mockRequest.get('/ok').reply(200, 'Ok');

    await nimbus.ping().then((alive: boolean) => {
      expect(alive).toEqual(true);
    });
  });
  it('returns false on any non 2xx http code ', async () => {
    for (const httpCode in StatusCodes) {
      const codeNum = Number(httpCode);
      if (isNaN(codeNum)) {
        continue;
      } else if (codeNum >= 200 && codeNum < 300) {
        continue;
      }
      let logMessage: string;
      console.error = jest.fn((...args: string[]) => {
        logMessage = args[0];
      });
      mockRequest
        .get('/ok')
        .reply(parseInt(httpCode), getReasonPhrase(httpCode));
      await nimbus.ping().then((alive: boolean) => {
        expect(alive).toEqual(false);
        expect(console.error).toHaveBeenCalled();
        const pattern = '^Error.+?:' + httpCode;
        expect(logMessage).toMatch(new RegExp(pattern));
      });
      mockRequest.done();
    }
  });
  it('returns false when the server is unreachable', async () => {
    let logMessage: string;
    console.error = jest.fn((...args: string[]) => {
      logMessage = args[0];
    });
    mockRequest
      .get('/ok')
      .delayConnection(NimbusServer.connectionTimeout + 500)
      .reply(200, 'Ok');
    await nimbus.ping().then((alive: boolean) => {
      expect(alive).toEqual(false);
      expect(console.error).toHaveBeenCalled();
      expect(logMessage).toMatch('Error');
    });
  });
});
