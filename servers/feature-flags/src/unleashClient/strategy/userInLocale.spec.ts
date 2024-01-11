import { UnleashContext } from '../../graphql/typeDefs';
import { UserInLocaleStrategy } from './userInLocale';

describe('Strategy: userInLocale', () => {
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
    locales: ['en', 'en-US'],
  };

  it('should have correct name', async () => {
    const strategy = await new UserInLocaleStrategy();
    expect(strategy.name).toBe('userInLocale');
  });

  /**
   * Test setup validity
   * --------------------------------------------------------
   */

  it('should not assign users that send incomplete data', async () => {
    const strategy = await new UserInLocaleStrategy();
    const activation = strategy.isEnabled(params, defaultContext);
    expect(activation).toBeFalsy();
  });

  /**
   * Locale validity
   * --------------------------------------------------------
   */
  it('should assign users in specified locales', async () => {
    const strategy = await new UserInLocaleStrategy();
    const properties = {
      locale: 'en-US',
    };

    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeTruthy();
  });

  it('should not assign users in unspecified locales', async () => {
    const strategy = await new UserInLocaleStrategy();
    const properties = {
      locale: 'de',
    };

    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  // if user's locale is not in Pocket's list of supported locales, do not assign them to the test.
  it('should not assign users in unsupported locales if they are not eligible', async () => {
    const strategy = await new UserInLocaleStrategy();
    const properties = {
      locale: 'af',
    };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  /**
   * Respects rollout percentage
   * --------------------------------------------------------
   */
  it('should not assign users if rollout is 0%', async () => {
    const strategy = await new UserInLocaleStrategy();

    const activation = strategy.isEnabled(
      { ...params, rollout: 0 },
      defaultContext,
    );
    expect(activation).toBeFalsy();
  });
});
