import { expect } from 'chai';
import { getHandler, KinesisEvent } from './handler';
import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';

const createEvent = (msg: Record<string, unknown>): KinesisEvent => {
  const data = Buffer.from(JSON.stringify(msg)).toString('base64');

  return {
    Records: [
      {
        kinesis: {
          data,
        },
      },
    ],
  };
};

const sendMessageBatchSuccess = { Failed: [] };

describe('kinesis', () => {
  describe('handler', () => {
    let handler: any;

    beforeEach(async () => {
      AWSMock.setSDKInstance(AWS);
      AWSMock.mock(
        'SQS',
        'sendMessageBatch',
        (params: any, callback: (param1: any, param2: any) => void) => {
          callback(null, sendMessageBatchSuccess);
        }
      );

      handler = await getHandler(new AWS.SQS(), {
        userListImportUrl: 'userListImportUrl',
        userItemsUpdateUrl: 'userItemsUpdateUrl',
        userItemsDeleteUrl: 'userItemsDeleteUrl',
      });
    });

    afterEach(() => {
      AWSMock.restore('SQS');
    });

    it('handles premium subscription events', async () => {
      const premiumSubscriptionCreatedEvent = createEvent({
        type: 'premium-subscription-created',
        data: {
          user_id: 111,
        },
      });

      expect(
        await handler(premiumSubscriptionCreatedEvent)
      ).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item created events', async () => {
      const userListItemCreatedEvent = createEvent({
        type: 'user-list-item-created',
        data: {
          user_id: 111,
          item_id: 222,
        },
      });

      expect(await handler(userListItemCreatedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item tag added events', async () => {
      const userItemTagsAddedEvent = createEvent({
        type: 'user-item-tags-added',
        data: {
          user_id: 111,
          item_id: 222,
          tags: ['the', 'dude', 'abides'],
        },
      });

      expect(await handler(userItemTagsAddedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item tag removed events', async () => {
      const userItemTagsRemovedEvent = createEvent({
        type: 'user-item-tags-removed',
        data: {
          user_id: 111,
          item_id: 222,
          tags: ['the', 'dude', 'abides'],
        },
      });

      expect(await handler(userItemTagsRemovedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item tag replaced events', async () => {
      const userItemTagsReplacedEvent = createEvent({
        type: 'user-item-tags-replaced',
        data: {
          user_id: 111,
          item_id: 222,
          tags: ['the', 'dude', 'abides'],
        },
      });

      expect(await handler(userItemTagsReplacedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item archived events', async () => {
      const userItemArchivedEvent = createEvent({
        type: 'user-item-archived',
        data: {
          user_id: 111,
          item_id: 222,
        },
      });

      expect(await handler(userItemArchivedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item deleted events', async () => {
      const userItemDeletedEvent = createEvent({
        type: 'user-item-deleted',
        data: {
          user_id: 111,
          item_id: 222,
        },
      });

      expect(await handler(userItemDeletedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });
    it('handles user list item unarchived', async () => {
      const userItemUnarchivedEvent = createEvent({
        type: 'user-item-unarchived',
        data: {
          user_id: 111,
          item_id: 222,
        },
      });

      expect(await handler(userItemUnarchivedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item favorited', async () => {
      const userItemFavoritedEvent = createEvent({
        type: 'user-item-favorited',
        data: {
          user_id: 111,
          item_id: 222,
        },
      });

      expect(await handler(userItemFavoritedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });

    it('handles user list item unfavorited', async () => {
      const userItemUnfavoritedEvent = createEvent({
        type: 'user-item-unfavorited',
        data: {
          user_id: 111,
          item_id: 222,
        },
      });

      expect(await handler(userItemUnfavoritedEvent)).to.have.all.members([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);
    });
  });
});
