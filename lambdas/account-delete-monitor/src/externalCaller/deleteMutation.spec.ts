import { config } from '../config';
import { deleteUserMutationCaller, userApiCalls } from './deleteMutation';
import nock from 'nock';

describe('deleteUser mutation test', () => {
  const testUserId = '1001';

  afterEach(() => {
    //require this to clear `spyOn` counts between tests
    jest.clearAllMocks();
  });

  it('should succeed on the second try if the first call fails', async () => {
    const testResponse = {
      data: {
        deleteUser: testUserId,
      },
    };

    nock(config.userApi.url).post('/').replyWithError('Something went wrong');
    nock(config.userApi.url).post('/').reply(200, testResponse);

    const userApiCaller = jest.spyOn(userApiCalls, 'deleteUserMutation');
    const res = await deleteUserMutationCaller(testUserId);
    expect(userApiCaller).toBeCalledTimes(2);
    expect(res).toEqual(testUserId);
  });

  it('should throw an error after three failed tries', async () => {
    const testError = 'Something went wrong';

    nock(config.userApi.url).post('/').times(3).replyWithError(testError);

    const userApiCaller = jest.spyOn(userApiCalls, 'deleteUserMutation');

    await expect(deleteUserMutationCaller(testUserId)).rejects.toThrowError(
      testError,
    );
    expect(userApiCaller).toBeCalledTimes(3);
  });

  it('should throw errors if graphql response has errors', async () => {
    const testError = [{ message: 'test-error' }];
    nock(config.userApi.url).post('/').reply(200, {
      errors: testError,
    });

    await expect(deleteUserMutationCaller(testUserId)).rejects.toThrowError(
      `Error calling deleteUser mutation.\n GraphQL Errors: ${JSON.stringify(
        testError,
      )}`,
    );
  });
});
