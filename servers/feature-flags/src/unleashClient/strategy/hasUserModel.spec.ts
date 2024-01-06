import {
  UnleashContext,
  UnleashProperties,
  RecItUserProfile,
} from '../../graphql/typeDefs';
import { HasUserModel } from './hasUserModel';

describe('Strategy: hasUserModel', () => {
  let defaultContext: UnleashContext;

  let params;

  beforeEach(async () => {
    defaultContext = {
      appName: 'Unleash Testing',
      environment: 'test',
      userId: 'abcd1234',
      sessionId: '09876zyxw',
    };

    params = {
      rollout: 100,
      stickiness: 'default',
      groupId: 'Demo',
    };
  });

  it('should have correct name', async () => {
    const strategy = await new HasUserModel();
    expect(strategy.name).toBe('hasUserModel');
  });

  it('assigns users when a userModel parameter matches', async () => {
    const activation = new HasUserModel().isEnabled(
      { ...params, userModel: 'ABC123' },
      createContextWithUserModels(['ABC123', 'DEF456'])
    );
    expect(activation).toBeTruthy();
  });

  it('should not assign users that send no user profile', async () => {
    const activation = new HasUserModel().isEnabled(
      { ...params, userModel: 'ABC123' },
      defaultContext
    );
    expect(activation).toBeFalsy();
  });

  it('should not assign users when the user has no user models', async () => {
    const activation = new HasUserModel().isEnabled(
      { ...params, userModel: 'XYZ' },
      createContextWithUserModels([])
    );
    expect(activation).toBeFalsy();
  });

  it('should not assign users when the userModel parameter does not match', async () => {
    const activation = new HasUserModel().isEnabled(
      { ...params, userModel: 'XYZ' },
      createContextWithUserModels(['ABC123', 'DEF456'])
    );
    expect(activation).toBeFalsy();
  });

  it('should not assign user with null user profile', async () => {
    const strategy = await new HasUserModel();
    const properties: UnleashProperties = {
      recItUserProfile: null,
    };
    const context: UnleashContext = { ...defaultContext, properties };
    const activation = strategy.isEnabled(params, context);
    expect(activation).toBeFalsy();
  });

  it('should not assign users when rollout is 0', async () => {
    const activation = new HasUserModel().isEnabled(
      { ...params, rollout: 0 },
      createContextWithUserModels(['ABC123', 'DEF456'])
    );
    expect(activation).toBeFalsy();
  });

  it('should not assign user when userModel parameter is missing', async () => {
    const activation = new HasUserModel().isEnabled(
      params,
      createContextWithUserModels(['ABC123'])
    );
    expect(activation).toBeFalsy();
  });

  function createContextWithUserModels(userModels: string[]) {
    const userProfile: RecItUserProfile = { userModels: userModels };
    const properties: UnleashProperties = {
      recItUserProfile: JSON.stringify(userProfile),
    };
    const context: UnleashContext = { ...defaultContext, properties };
    return context;
  }
});
