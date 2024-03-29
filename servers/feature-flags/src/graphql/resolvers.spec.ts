import { resolvers } from './resolvers';
import { RequestHandlerContext } from './index';
import { UnleashContext, UnleashProperties } from './typeDefs';
import * as UnleashClient from '../unleashClient';

describe('resolvers converts unleash assignment', () => {
  let defaultProperties: UnleashProperties;

  let defaultContext: UnleashContext;

  let defaultArgs: any;

  let defaultRequestHandler: RequestHandlerContext;

  let unleashStub;

  beforeEach(async () => {
    // Create a mock Unleash client, and return it when getUnleashClient is called.
    unleashStub = jest.createMockFromModule('unleash-client');
    const getUnleashStub = jest.spyOn(UnleashClient, 'getUnleashClient');
    getUnleashStub.mockReturnValue(unleashStub);

    defaultProperties = {};

    defaultContext = {
      appName: 'Android',
      environment: 'Testing',
      userId: 'user123',
      sessionId: 'guid123',
      properties: defaultProperties,
    };

    defaultArgs = {
      context: defaultContext,
    };

    defaultRequestHandler = {
      headers: {},
      ip: '1.1.1.1',
      forwardedIp: '1.1.1.2',
      locale: 'en-US',
    };
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it('returns no assignments if there are no feature toggles', async () => {
    // There are no feature toggles
    unleashStub.getFeatureToggleDefinitions.mockReturnValue([]);

    const assignments = await resolvers.Query.getUnleashAssignments(
      null,
      defaultArgs,
      defaultRequestHandler,
    );

    expect(assignments).toEqual({ assignments: [] });
  });

  it('returns no assignments if there are no feature toggles on assignments', async () => {
    // There are no feature toggles
    unleashStub.getFeatureToggleDefinitions.mockReturnValue([]);

    const assignments = await resolvers.Query.unleashAssignments(
      null,
      defaultArgs,
      defaultRequestHandler,
    );

    expect(assignments).toEqual({ assignments: [] });
  });

  it('JSON-encodes the user profile that is passed to isEnabled', async () => {
    // There is a single feature toggle
    const featureName = 'my_feature';
    const feature: any = {
      name: featureName,
      enabled: true,
      stale: false,
      strategies: [],
      variants: [],
      impressionData: false,
    };

    // Properties has a recItUserProfile object
    defaultArgs.context.properties = {
      ...defaultArgs.context.properties,
      recItUserProfile: { userModels: ['model123'] },
    };
    // Set the return values of the stubbed Unleash methods.
    unleashStub.getFeatureToggleDefinitions.mockReturnValue([feature]);
    unleashStub.isEnabled.mockReturnValue(true);

    // getUnleashAssignments modifies its arguments, so set the expected context before calling getUnleashAssignments.
    const expectedContext = { ...defaultArgs.context };
    expectedContext.properties = {
      ...expectedContext.properties,
      recItUserProfile: JSON.stringify(
        defaultArgs.context.properties.recItUserProfile,
      ),
    };

    // getUnleashAssignments is the subject of this test.
    const assignments = await resolvers.Query.getUnleashAssignments(
      null,
      defaultArgs,
      defaultRequestHandler,
    );

    expect(assignments).toEqual({
      assignments: [{ name: featureName, assigned: true }],
    });
  });
});
