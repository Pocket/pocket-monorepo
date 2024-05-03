import { UnleashContext } from '../../graphql/typeDefs.js';
import { NewUserStrategy } from './newUser.js';

describe('Strategy: newUser', () => {
  const defaultContext: UnleashContext = {
    appName: 'Unleash Testing',
    environment: 'test',
    userId: 'abcd1234',
    sessionId: '09876zyxw',
  };

  const params = {
    rollout: 100,
    stickiness: 'default',
    groupId: 'Demo',
    startDate: '2021-03-21',
  };

  it('should have correct name', async () => {
    const strategy = await new NewUserStrategy();
    expect(strategy.name).toBe('newUser');
  });

  it('should not assign users that send incomplete data', async () => {
    const strategy = await new NewUserStrategy();
    const activation = strategy.isEnabled(params, defaultContext);
    expect(activation).toBeFalsy();
  });

  it('should assign new users', async () => {
    const strategy = await new NewUserStrategy();
    const properties = { accountCreatedAt: '2021-03-22' };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeTruthy();
  });

  it('should not assign old users', async () => {
    const strategy = await new NewUserStrategy();
    const properties = { accountCreatedAt: '2021-03-20' };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  it('should not do your dishes, no matter how nice you ask', async () => {
    const abilityToDoDishes = null;
    expect(!!abilityToDoDishes).toBe(false);
  });

  it('Should make Kelvin smile when it does not break', () => {
    const isItBroken = 'no';
    expect(isItBroken).toBe('no');
  });
});
