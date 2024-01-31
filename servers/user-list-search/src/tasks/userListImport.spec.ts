import { expect } from 'chai';
import {
  createUserItemsUpdateQueueMessage,
  processMessages,
} from './userListImport';
import { MysqlDataSource } from '../datasource/MysqlDataSource';
import { sendMessage, receiveMessage, purgeQueue } from '../sqs';
import { config } from '../config';
import { seedDb, getArrayOfIds } from '../test/_support/seeder';

describe('Backfill User Search Processor', () => {
  it('loads a user list and pushes to next queue', async () => {
    //Reset the db and the queues
    await Promise.all([
      seedDb({ truncate: true, userCount: 2, listCount: 2001, tagCount: 5 }),
      purgeQueue(config.aws.sqs.userItemsUpdateUrl),
      purgeQueue(config.aws.sqs.userListImportUrl),
    ]);

    // Send the users to index to the sqs queue
    await sendMessage(config.aws.sqs.userListImportUrl, {
      users: [
        {
          userId: 1,
        },
        {
          userId: 2,
        },
      ],
    });

    // Let the backfill processor, process the messages
    await processMessages(new MysqlDataSource());

    //Request the expected 6 messages from the queue
    const backfillMessages = await receiveMessage(
      config.aws.sqs.userItemsUpdateUrl,
      {
        QueueUrl: config.aws.sqs.userItemsUpdateUrl,
        MaxNumberOfMessages: 6,
      }
    );

    //Verify each message has the expected results.

    expect(JSON.parse(backfillMessages.Messages[0].Body)).to.deep.equal({
      userItems: [{ userId: 1, itemIds: getArrayOfIds(1000) }],
    });

    expect(JSON.parse(backfillMessages.Messages[1].Body)).to.deep.equal({
      userItems: [{ userId: 1, itemIds: getArrayOfIds(1000, 1001) }],
    });

    expect(JSON.parse(backfillMessages.Messages[2].Body)).to.deep.equal({
      userItems: [{ userId: 1, itemIds: getArrayOfIds(1, 2001) }],
    });

    expect(JSON.parse(backfillMessages.Messages[3].Body)).to.deep.equal({
      userItems: [{ userId: 2, itemIds: getArrayOfIds(1000) }],
    });

    expect(JSON.parse(backfillMessages.Messages[4].Body)).to.deep.equal({
      userItems: [{ userId: 2, itemIds: getArrayOfIds(1000, 1001) }],
    });

    expect(JSON.parse(backfillMessages.Messages[5].Body)).to.deep.equal({
      userItems: [{ userId: 2, itemIds: getArrayOfIds(1, 2001) }],
    });
  }, 20000);

  it('creates an update user search queue message', () => {
    const itemIds = [1, 2, 3];
    const message = createUserItemsUpdateQueueMessage(1, itemIds);
    expect(message).to.deep.equal({
      userItems: [{ userId: 1, itemIds }],
    });
  });
});
