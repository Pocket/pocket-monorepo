import sinon from 'sinon';
import { NotesDataService } from './notes';
import { BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import config from '../config';
import { dynamoClient } from '../database/client';

describe('Notes data service', () => {
  let dynamoSendStub: sinon.stub;
  const service = new NotesDataService(dynamoClient(), '1');

  const dynamoFirstResult: BatchGetCommandOutput = {
    Responses: {
      [config.dynamoDb.notesTable.name]: [
        { id: 1, note: 'what a zesty pâté' },
        { id: 2, note: 'I feel like a hummingbird' },
      ],
    },
    UnprocessedKeys: {
      table: {
        Keys: [{ id: 3 }],
      },
    },
    $metadata: {},
  };
  const dynamoSecondResult: BatchGetCommandOutput = {
    Responses: {
      [config.dynamoDb.notesTable.name]: [
        { id: 3, note: 'scalier than a dehydrated komodo' },
      ],
    },
    $metadata: {},
  };
  beforeEach(() => {
    dynamoSendStub = sinon
      .stub(service.dynamo, 'send')
      .onFirstCall()
      .resolves(dynamoFirstResult)
      .onSecondCall()
      .resolves(dynamoSecondResult);
  });
  afterEach(() => {
    dynamoSendStub.restore();
  });
  it('retries unprocessed keys and concatenates results', async () => {
    const result = await service.getMany(['1', '2', '3']);
    const expectedText = [
      'what a zesty pâté',
      'I feel like a hummingbird',
      'scalier than a dehydrated komodo',
    ];
    expect(result?.length).toEqual(3);
    // Ignore the additional undefined fields from the toGraphQL function
    // just examine text
    const textResult = result?.map((_) => _.text);
    expect(textResult).toStrictEqual(expectedText);
    // Should have called `send` twice to finish the batch
    expect(dynamoSendStub.callCount).toEqual(2);
  });
});
