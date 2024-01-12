import { BatchDeleteDyanmoClient } from './dynamoUtils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { config } from './config';
import sinon from 'sinon';
import * as DeleteMutation from './externalCaller/deleteMutation';
import { deleteUsers } from './index';
import * as Sentry from '@sentry/serverless';

describe('deleteUsers spec test', () => {
  let client;
  let dynamoDbUtils;

  beforeAll(() => {
    client = new DynamoDBClient({
      region: config.aws.region,
      endpoint: config.aws.endpoint,
    });

    dynamoDbUtils = new BatchDeleteDyanmoClient(client);
  });

  beforeEach(() => {
    sinon.restore();
  });

  it('should move UserIds that was successfully deleted', async () => {
    const testUserIds: number[] = [1];
    sinon.stub(dynamoDbUtils, 'getBatch').returns(Promise.resolve(testUserIds));
    sinon.stub(DeleteMutation, 'deleteUserMutationCaller').resolves('1');
    const spy = sinon.stub(dynamoDbUtils, 'moveBatch').resolves();
    await deleteUsers(dynamoDbUtils);
    expect(spy.calledOnceWithExactly([1])).toBeTruthy();
  });

  it('should not move UserIds that was not successfully deleted', async () => {
    const testUserIds: number[] = [1];
    sinon.stub(dynamoDbUtils, 'getBatch').returns(Promise.resolve(testUserIds));
    sinon
      .stub(DeleteMutation, 'deleteUserMutationCaller')
      .throws(new Error('delete error'));
    const spy = sinon.stub(dynamoDbUtils, 'moveBatch').resolves();
    const consoleSpy = sinon.spy(console, 'log');
    const sentrySpy = sinon.spy(Sentry, 'captureException');
    await deleteUsers(dynamoDbUtils);
    expect(spy.calledOnceWithExactly([])).toBeTruthy();
    expect(consoleSpy.calledOnceWithExactly(`unable to delete userId ${1}`));
    expect(
      sentrySpy.calledOnceWithExactly({
        message: `unable to delete userId ${1}`,
      }),
    );
  });
});
