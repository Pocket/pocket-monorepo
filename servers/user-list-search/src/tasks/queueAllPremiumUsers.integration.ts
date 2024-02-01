import { expect } from 'chai';
import { config } from '../config';
import { receiveMessage, purgeQueue } from '../sqs';
import {
  queueUserIds,
  createUserListImportQueueMessage,
} from './queueAllPremiumUsers';

describe('queueAllPremiumUsers', () => {
  describe('queueUserIds', () => {
    it('should send the expected sqs messages', async () => {
      const userIds = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      const userIdsCopy = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

      // clear the queue just in case
      await purgeQueue(config.aws.sqs.userListImportUrl);

      // queue up the user ids
      await queueUserIds(userIdsCopy, 3);

      // get the messages off the queue
      const backfillMessages = await receiveMessage(
        config.aws.sqs.userListImportUrl,
        {
          QueueUrl: config.aws.sqs.userListImportUrl,
          MaxNumberOfMessages: 4,
        },
      );

      expect(JSON.parse(backfillMessages.Messages[0].Body)).to.deep.equal({
        users: [
          { userId: userIds[0] },
          { userId: userIds[1] },
          { userId: userIds[2] },
        ],
      });

      expect(JSON.parse(backfillMessages.Messages[1].Body)).to.deep.equal({
        users: [
          { userId: userIds[3] },
          { userId: userIds[4] },
          { userId: userIds[5] },
        ],
      });

      expect(JSON.parse(backfillMessages.Messages[2].Body)).to.deep.equal({
        users: [
          { userId: userIds[6] },
          { userId: userIds[7] },
          { userId: userIds[8] },
        ],
      });

      expect(JSON.parse(backfillMessages.Messages[3].Body)).to.deep.equal({
        users: [{ userId: userIds[9] }],
      });
    });
  });

  describe('createUserListImportQueueMessage', () => {
    it('creates a user list import queue message', () => {
      const userIds = [1, 2, 3, 5, 8];
      const expected = {
        users: [
          {
            userId: 1,
          },
          {
            userId: 2,
          },
          {
            userId: 3,
          },
          {
            userId: 5,
          },
          {
            userId: 8,
          },
        ],
      };

      const message = createUserListImportQueueMessage(userIds);

      expect(message).to.deep.equal(expected);
    });
  });
});
