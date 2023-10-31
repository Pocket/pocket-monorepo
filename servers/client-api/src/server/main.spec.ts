import { contextFactory } from './context';
import sinon from 'sinon';
import * as jwtUtils from '../jwtUtils';

describe('Context factory function', () => {
  it('multiple invocations only fetch public keys once', async () => {
    const keySpy = sinon.spy(jwtUtils, 'getSigningKeysFromServer');
    await contextFactory({ req: { headers: {} } });
    await contextFactory({ req: { headers: {} } });
    await contextFactory({ req: { headers: {} } });
    expect(keySpy.callCount).toEqual(1);
  });
});
