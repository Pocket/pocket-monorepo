import { UnleashContext } from '../../graphql/typeDefs';
import { AccountAgeStrategy } from './accountAge';

// Helper function to get the date parts (year, month, day) in a given timezone.
// TODO: It would be nice if there were tests around this helper, especially if we start using it more.
const getDatePartsMap = (
  date: Date,
  timeZone: string,
): { [key: string]: string } => {
  // Intl.DateTimeFormat allows us to specify a custom date format and timezone.
  // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
  const intlDateObj = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: timeZone,
  });
  // formatToParts allows us to get date parts in format specified above. The return value is an array of objects.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts
  const parts = intlDateObj.formatToParts(date);
  // Convert the array to a key-value object, to easily access particular parts (year, month, day).
  const partsMap = {};
  for (let i = 0; i < parts.length; ++i)
    partsMap[parts[i]['type']] = parts[i]['value'];

  return partsMap;
};

// This function creates a date in US/Central time formatted as YYYY-M-D, n days befores the current date time.
// The behavior of accountAge is gated on 'accountCreatedAt', the date in central time that the user account was created,
// for example "2021-06-10". accountCreatedAt is in central time because that's how we store it in our database.
// To reliably test accountAge, our test input should therefore also be in central time.
const daysSinceTodayInCentralTime = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const parts = getDatePartsMap(date, 'US/Central');
  return `${parts['year']}-${parts['month']}-${parts['day']}`;
};

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
    accountAge: 30,
  };

  it('should have correct name', async () => {
    const strategy = await new AccountAgeStrategy();
    expect(strategy.name).toBe('accountAge');
  });

  it('should not assign users that send incomplete data', async () => {
    const strategy = await new AccountAgeStrategy();
    const activation = strategy.isEnabled(params, defaultContext);
    expect(activation).toBeFalsy();
  });

  it('should assign users with accounts old enough', async () => {
    const strategy = await new AccountAgeStrategy();
    const properties = { accountCreatedAt: daysSinceTodayInCentralTime(31) };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeTruthy();
  });

  it('should assign users with accounts exactly old enough', async () => {
    const strategy = await new AccountAgeStrategy();
    const properties = { accountCreatedAt: daysSinceTodayInCentralTime(30) };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeTruthy();
  });

  it('should not assign users with new accounts', async () => {
    const strategy = await new AccountAgeStrategy();
    const properties = { accountCreatedAt: daysSinceTodayInCentralTime(29) };
    const context = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  it('should volunteer on weekend for the emotional fulfillment', async () => {
    const freeThisWeekend = false;
    expect(freeThisWeekend).toBeFalsy();
  });
});
