import { BatchDeleteDyanmoClient } from './dynamoUtils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { config } from './config';
import * as DeleteMutation from './externalCaller/deleteMutation';
import { deleteUsers } from './index';
import * as Sentry from '@sentry/serverless';

describe('deleteUsers spec test', () => {
  let client: DynamoDBClient;
  let dynamoDbUtils: BatchDeleteDyanmoClient;

  beforeAll(() => {
    client = new DynamoDBClient({
      region: config.aws.region,
      endpoint: config.aws.endpoint,
    });

    dynamoDbUtils = new BatchDeleteDyanmoClient(client);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should move UserIds that was successfully deleted', async () => {
    const testUserIds: number[] = [1];
    jest.spyOn(dynamoDbUtils, 'getBatch').mockImplementation(() => {
      return Promise.resolve(testUserIds);
    });
    jest
      .spyOn(DeleteMutation, 'deleteUserMutationCaller')
      .mockImplementation(() => {
        return Promise.resolve('1');
      });
    const spy = jest
      .spyOn(dynamoDbUtils, 'moveBatch')
      .mockImplementation(() => {
        return Promise.resolve();
      });
    await deleteUsers(dynamoDbUtils);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not move UserIds that was not successfully deleted', async () => {
    const testUserIds: number[] = [1];
    jest.spyOn(dynamoDbUtils, 'getBatch').mockImplementation(() => {
      return Promise.resolve(testUserIds);
    });
    jest
      .spyOn(DeleteMutation, 'deleteUserMutationCaller')
      .mockImplementation(() => {
        throw new Error('delete error');
      });
    const spy = jest
      .spyOn(dynamoDbUtils, 'moveBatch')
      .mockImplementation(() => {
        return Promise.resolve();
      });
    const consoleSpy = jest.spyOn(console, 'log');
    const sentrySpy = jest.spyOn(Sentry, 'captureException');
    await deleteUsers(dynamoDbUtils);
    expect(spy).toHaveBeenCalledWith([]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(`unable to delete userId ${1}`);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(sentrySpy).toHaveBeenCalledWith({
      message: `unable to delete userId ${1}`,
    });
    expect(sentrySpy).toHaveBeenCalledTimes(1);
  });
});
