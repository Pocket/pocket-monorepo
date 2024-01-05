import { setTimeout } from 'timers/promises';
import { timeIt } from './timeIt';
import sinon, { SinonSpy } from 'sinon';

describe('timeIt', () => {
  const sandbox = sinon.createSandbox();
  let sleep: SinonSpy;
  let log: SinonSpy;
  beforeEach(() => {
    sleep = sandbox.spy(setTimeout);
    log = sandbox.spy(console, 'log');
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('invokes function with single argument', async () => {
    await timeIt(sleep, { printToConsole: false })(5);
    sandbox.assert.alwaysCalledWith(sleep, 5);
    sandbox.assert.callCount(sleep, 100);
  });
  it('invokes function with object as argument', async () => {
    const myFun = async (options: { wait: number; bar: any }) => {
      await sleep(options.wait);
    };
    await timeIt(myFun, {
      printToConsole: false,
      times: 20,
    })({ wait: 5, bar: 1 });
    sandbox.assert.alwaysCalledWith(sleep, 5);
    sandbox.assert.callCount(sleep, 20);
  });
  it('invokes function with multiple arguments', async () => {
    const multiplySleep = async (base: number, mult: number) => {
      await sleep(base * mult);
    };
    await timeIt(multiplySleep, {
      printToConsole: false,
      times: 20,
    })(2, 2);
    sandbox.assert.alwaysCalledWith(sleep, 4);
    sandbox.assert.callCount(sleep, 20);
  });
  it('invokes function correct number of times (default)', async () => {
    await timeIt(sleep, {
      printToConsole: false,
    })(2);
    sandbox.assert.alwaysCalledWith(sleep, 2);
    sandbox.assert.callCount(sleep, 100);
  });
  it('invokes function correct number of times', async () => {
    await timeIt(sleep, {
      printToConsole: false,
      times: 20,
    })(2);
    sandbox.assert.alwaysCalledWith(sleep, 2);
    sandbox.assert.callCount(sleep, 20);
  });
  it.skip('returns timing results when specified', async () => {
    const res = await timeIt(sleep, {
      printToConsole: false,
      returnValues: true,
      times: 5,
    })(100);
    sandbox.assert.alwaysCalledWith(sleep, 100);
    expect(res.length).toEqual(5);
    // check that all values fall within range of 90-110
    // Potential to flake; 10% allowance
    expect(res.filter((time) => time > 110 || time < 90).length).toEqual(0);
  });
  it('prints to console with function name, times, and data when specified', async () => {
    await timeIt(sleep, {
      printToConsole: true,
      name: 'pullman',
      times: 5,
    })(100);
    const consoleRegex =
      /pullman: average ([\d]+|[\d]+\.[\d]*) ms over 5 trials \(min: \d{2,3}, max: \d{2,3}\)/;
    sandbox.assert.alwaysCalledWith(sleep, 100);
    sandbox.assert.calledOnceWithMatch(log, consoleRegex);
  });
});
