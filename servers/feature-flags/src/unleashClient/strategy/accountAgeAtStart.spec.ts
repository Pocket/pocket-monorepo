import { UnleashContext } from '../../graphql/typeDefs';
import { AccountAgeAtStartStrategy } from './accountAgeAtStart';

describe('Strategy: accountAgeAtStart', () => {
  const context: UnleashContext = {
    appName: 'Unleash Testing',
    environment: 'test',
    userId: 'abcd1234',
    sessionId: '09876zyxw',
    properties: { accountCreatedAt: '2021-03-22 22:24:20' },
  };

  const params = {
    rollout: 100,
    stickiness: 'default',
    groupId: 'Demo',
  };

  it('should have correct name', async () => {
    const strategy = await new AccountAgeAtStartStrategy();
    expect(strategy.name).toBe('accountAgeAtStart');
  });

  it('should not assign users that send incomplete data', async () => {
    const strategy = await new AccountAgeAtStartStrategy();
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  it('should assign accounts that are very mature', async () => {
    const strategy = await new AccountAgeAtStartStrategy();
    // 1 year after account creation
    const test = { startDate: '2022-03-24', accountAge: 180 };
    const activation = strategy.isEnabled({ ...params, ...test }, context);
    expect(activation).toBeTruthy();
  });

  it('should assign accounts that are just old enough', async () => {
    const strategy = await new AccountAgeAtStartStrategy();
    // 7 days after account creation
    const test = { startDate: '2021-04-01', accountAge: 7 };
    const activation = strategy.isEnabled({ ...params, ...test }, context);
    expect(activation).toBeTruthy();
  });

  it('should not assign accounts that are too young', async () => {
    const strategy = await new AccountAgeAtStartStrategy();
    // 1 day after account creation
    const test = { startDate: '2021-03-24', accountAge: 7 };
    const activation = strategy.isEnabled({ ...params, ...test }, context);
    expect(activation).toBeFalsy();
  });

  it("should not assign accounts that are too young even if they're close", async () => {
    const strategy = await new AccountAgeAtStartStrategy();
    // 6 days after account creation
    const test = { startDate: '2021-03-29', accountAge: 7 };
    const activation = strategy.isEnabled({ ...params, ...test }, context);
    expect(activation).toBeFalsy();
  });

  it('should be a well rounded individual', async () => {
    const needlePoint = true;
    const knifeThrowing = true;
    const watchesRealityTVNonStop = false;
    expect(
      needlePoint && knifeThrowing && !watchesRealityTVNonStop,
    ).toBeTruthy();
  });

  it('should not lie to me that the tests work', async () => {
    const falsePositiveFromPoorTests = false;
    expect(falsePositiveFromPoorTests).toBeFalsy();
  });
});
