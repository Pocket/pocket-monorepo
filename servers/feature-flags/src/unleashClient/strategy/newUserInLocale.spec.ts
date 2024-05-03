import { UnleashContext } from '../../graphql/typeDefs.js';
import { NewUserInLocaleStrategy } from './newUserInLocale.js';

describe('Strategy: newUserInLocale', () => {
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
    startDate: '2020-10-22',
    locales: ['en', 'en-US'],
  };

  const invalidStartDate = '2020-13-01';
  const invalidDate = '2015-13-01 09:49:47';
  const oldAccount = '2015-10-22 09:49:47';
  const eligibleAccount = '2021-10-22 00:00:00';

  it('should have correct name', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    expect(strategy.name).toBe('newUserInLocale');
  });

  /**
   * Account age validity
   * --------------------------------------------------------
   */
  it('should assign new users in supported locales', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const properties = {
      accountCreatedAt: eligibleAccount,
      locale: 'en',
    };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeTruthy();
  });

  it('should not assign old users in supported locales', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const properties = {
      accountCreatedAt: oldAccount,
      locale: 'en',
    };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  /**
   * Test setup validity
   * --------------------------------------------------------
   */
  it('should not assign users if the test is set up incorrectly', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const parameters = { ...params, startDate: invalidStartDate };
    const activation = strategy.isEnabled(parameters, defaultContext);
    expect(activation).toBeFalsy();
  });

  it('should not assign users that send incomplete data', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const activation = strategy.isEnabled(params, defaultContext);
    expect(activation).toBeFalsy();
  });

  it('should not assign users that send poorly formated data', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const properties = {
      accountCreatedAt: invalidDate,
      locale: 'de',
    };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);

    expect(activation).toBeFalsy();
  });

  /**
   * Locale validity
   * --------------------------------------------------------
   */
  it('should not assign users in unspecified locales', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const properties = {
      accountCreatedAt: eligibleAccount,
      locale: 'de',
    };

    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  // Testing that we are defaulting to en
  it('should assign users with no locale set if they are eligible', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const properties = { accountCreatedAt: eligibleAccount, locale: '' };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeTruthy();
  });

  // if user's locale is not in Pocket's list of supported locales, assign them to test
  // since they will be defaulted to EN on the analytics side
  it('should not assign users in unsupported locales if they are not eligible', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const properties = {
      accountCreatedAt: oldAccount,
      locale: 'af',
    };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  it('should assign users in unsupported locales if they are eligible', async () => {
    const strategy = await new NewUserInLocaleStrategy();
    const properties = {
      accountCreatedAt: eligibleAccount,
      locale: 'af',
    };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeTruthy();
  });

  it('should enter into beauty contests ... only if it wants to though', async () => {
    const wantsToEnterBeautyContest = null;
    expect(!!wantsToEnterBeautyContest).toBe(false);
  });

  it('Should make only break on the second Tuesday of the week', () => {
    const isThereASecondTuesday = 'no';
    expect(isThereASecondTuesday).toBe('no');
  });
});
