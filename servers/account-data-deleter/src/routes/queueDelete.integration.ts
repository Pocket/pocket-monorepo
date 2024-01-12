import { readClient, writeClient } from '../dataService/clients';
import sinon from 'sinon';
import { SQS } from '@aws-sdk/client-sqs';
import { enqueueTablesForDeletion } from './queueDelete';
import { AccountDeleteDataService } from '../dataService/accountDeleteDataService';
import { config } from '../config';

describe('enqueueTablesForDeletion', () => {
  const db = writeClient();

  let sqsSendMock, queryLimit, sqsBatchSize;
  beforeEach(() => {
    queryLimit = config.queueDelete.queryLimit;
    sqsBatchSize = config.aws.sqs.batchSize;
    sqsSendMock = sinon.stub(SQS.prototype, 'send');
  });

  afterEach(() => {
    config.queueDelete.queryLimit = queryLimit;
    config.aws.sqs.batchSize = sqsBatchSize;
    sinon.restore();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('enqueueRowIdForDeletion - userId tables', () => {
    beforeAll(async () => {
      await db('readitla_ril-tmp.user_ip').truncate();
      await db('readitla_ril-tmp.feed_user_recommendations').truncate();
      await db('readitla_ril-tmp.suggested_tags_user_grouping_tags').truncate();

      const userIp = [];
      const feedUserRecommendations = [];
      const suggestedTagsUserGroupingTags = [];
      for (let i = 1; i <= 6; i++) {
        userIp.push({
          id: i,
          user_id: 1,
          event_type: `event${i}`,
        });
        feedUserRecommendations.push({
          user_rec_id: i,
          user_id: 1,
          resolved_id: i,
        });
        suggestedTagsUserGroupingTags.push({
          grouping_id: i,
          user_id: 1,
          tag: `${i}`,
        });
      }
      await db('readitla_ril-tmp.user_ip').insert(userIp);
      await db('readitla_ril-tmp.feed_user_recommendations').insert(
        feedUserRecommendations,
      );
      await db('readitla_ril-tmp.suggested_tags_user_grouping_tags').insert(
        suggestedTagsUserGroupingTags,
      );
    });
    const tableNames = [
      { table: 'readitla_ril-tmp.user_ip', where: 'user_id' },
      { table: 'readitla_ril-tmp.feed_user_recommendations', where: 'user_id' },
      {
        table: 'readitla_ril-tmp.suggested_tags_user_grouping_tags',
        where: 'user_id',
      },
    ];
    it('sends batches of messages to sqs', async () => {
      config.queueDelete.queryLimit = 3;
      config.aws.sqs.batchSize = 1;
      const userId = 1;
      const savedItemService = new AccountDeleteDataService(
        userId,
        readClient(),
      );
      const base = {
        userId,
        email: 'test@yolo.com',
        isPremium: false,
      };
      const userIpData = {
        ...base,
        primaryKeyNames: ['id'],
        tableName: 'readitla_ril-tmp.user_ip',
      };
      const suggTagsData = {
        ...base,
        primaryKeyNames: ['user_id', 'grouping_id', 'tag'],
        tableName: 'readitla_ril-tmp.suggested_tags_user_grouping_tags',
      };
      const userRecData = {
        ...base,
        primaryKeyNames: ['user_rec_id'],
        tableName: 'readitla_ril-tmp.feed_user_recommendations',
      };
      const expectedMessages = [
        {
          ...userIpData,
          primaryKeyValues: [[1], [2], [3]],
        },
        {
          ...userIpData,
          primaryKeyValues: [[4], [5], [6]],
        },
        {
          ...userRecData,
          primaryKeyValues: [[1], [2], [3]],
        },
        {
          ...userRecData,
          primaryKeyValues: [[4], [5], [6]],
        },
        {
          ...suggTagsData,
          primaryKeyValues: [
            [1, 1, '1'],
            [1, 2, '2'],
            [1, 3, '3'],
          ],
        },
        {
          ...suggTagsData,
          primaryKeyValues: [
            [1, 4, '4'],
            [1, 5, '5'],
            [1, 6, '6'],
          ],
        },
      ];

      await enqueueTablesForDeletion(
        { ...base, traceId: 'abc-def' },
        savedItemService,
        '123',
        tableNames,
      );

      expect(sqsSendMock.callCount).toEqual(expectedMessages.length);
      const actualMessages = sqsSendMock.getCalls().map((call) => {
        return JSON.parse(call.args[0].input.Entries[0].MessageBody);
      });
      for (let i = 0; i < expectedMessages.length; i++) {
        expect(actualMessages[i]).toMatchObject(expectedMessages[i]);
        expect(actualMessages[i].traceId).not.toBeNull;
      }
    });
  });
  describe('enqueueRowIdForDeletion - non-userId tables', () => {
    const userId = 1;
    const base = {
      userId,
      email: 'test@yolo.com',
      isPremium: false,
    };
    beforeAll(async () => {
      await db('readitla_ril-tmp.bundle_users').truncate();
      await db('readitla_ril-tmp.paypal_transaction_log').truncate();
      const bundleData = [];
      const paypalData = [];
      for (let i = 1; i <= 6; i++) {
        bundleData.push({
          bundle_user_id: i,
          email: 'test@yolo.com',
        });
        paypalData.push({
          log_id: i,
          payer_email: 'test@yolo.com',
        });
      }
      await db('bundle_users').insert(bundleData);
      await db('paypal_transaction_log').insert(paypalData);
    });
    it('also sends messages in batches to sqs', async () => {
      const tableNames = [
        { table: 'readitla_ril-tmp.bundle_users', where: 'email' },
        {
          table: 'readitla_ril-tmp.paypal_transaction_log',
          where: 'payer_email',
        },
      ];
      config.queueDelete.queryLimit = 3;
      config.aws.sqs.batchSize = 1;
      const savedItemService = new AccountDeleteDataService(
        userId,
        readClient(),
      );

      const bundleData = {
        ...base,
        primaryKeyNames: ['bundle_user_id'],
        tableName: 'readitla_ril-tmp.bundle_users',
      };
      const paypalData = {
        ...base,
        primaryKeyNames: ['log_id'],
        tableName: 'readitla_ril-tmp.paypal_transaction_log',
      };
      const expectedMessages = [
        {
          ...bundleData,
          primaryKeyValues: [[1], [2], [3]],
        },
        {
          ...bundleData,
          primaryKeyValues: [[4], [5], [6]],
        },
        {
          ...paypalData,
          primaryKeyValues: [[1], [2], [3]],
        },
        {
          ...paypalData,
          primaryKeyValues: [[4], [5], [6]],
        },
      ];

      await enqueueTablesForDeletion(
        { ...base, traceId: 'abc-def' },
        savedItemService,
        '123',
        tableNames,
      );

      expect(sqsSendMock.callCount).toEqual(expectedMessages.length);
      const actualMessages = sqsSendMock.getCalls().map((call) => {
        return JSON.parse(call.args[0].input.Entries[0].MessageBody);
      });
      for (let i = 0; i < expectedMessages.length; i++) {
        expect(actualMessages[i]).toMatchObject(expectedMessages[i]);
        expect(actualMessages[i].traceId).not.toBeNull;
      }
    });
  });
  describe('enqueueRowIdForDeletion - tables with index only', () => {
    const userId = 1;
    const base = {
      userId,
      email: 'test@yolo.com',
      isPremium: false,
    };
    const loginFailureTable = 'readitla_ril-tmp.login_failures';
    const trackErrorTable = 'readitla_ril-tmp.track_errors';

    beforeAll(async () => {
      await db(loginFailureTable).truncate();
      await db(trackErrorTable).truncate();

      const loginFailures = [
        {
          user_id: 1,
          ip_address: 2130706433,
          date: 1417730406,
        },
        {
          user_id: 1,
          ip_address: 2130706434,
          date: 1417730407,
        },
        {
          user_id: 1,
          ip_address: 2130706444,
          date: 1417730416,
        },
        {
          user_id: 1,
          ip_address: 2130706444,
          date: 1417730416,
        },
        {
          user_id: 1,
          ip_address: 2130706454,
          date: 1417730426,
        },
        {
          user_id: 1,
          ip_address: 2130706454,
          date: 1417730426,
        },
      ];
      const trackErrors = [];
      let j = 0;
      for (let i = 0; i <= 9; i++) {
        j = Math.floor(i / 2);
        trackErrors.push({
          api_id: j,
          user_id: 1,
          time_happened: `2016-07-01 23:37:0` + j,
        });
      }

      await db(loginFailureTable).insert(loginFailures);
      await db(trackErrorTable).insert(trackErrors);
    });
    it('should queue indexColumn and user_id as primaryKeyColumn for non-pk tables', async () => {
      const tableNames = [
        { table: loginFailureTable, where: 'user_id' },
        { table: trackErrorTable, where: 'user_id' },
      ];

      config.queueDelete.queryLimit = 2;
      config.aws.sqs.batchSize = 1;
      const savedItemService = new AccountDeleteDataService(
        userId,
        readClient(),
      );

      const loginFailures = {
        ...base,
        primaryKeyNames: ['ip_address', 'user_id'],
        tableName: loginFailureTable,
      };

      const trackErrors = {
        ...base,
        primaryKeyNames: ['api_id', 'time_happened', 'user_id'],
        tableName: trackErrorTable,
      };

      const expectedMessages = [
        {
          ...loginFailures,
          primaryKeyValues: [
            [2130706433, 1],
            [2130706434, 1],
          ],
        },
        {
          ...loginFailures,
          primaryKeyValues: [
            [2130706444, 1],
            [2130706454, 1],
          ],
        },
        {
          ...trackErrors,
          //this test fails locally due to
          //difference in timezone
          primaryKeyValues: [
            [0, '2016-07-01T23:37:00.000Z', 1],
            [1, '2016-07-01T23:37:01.000Z', 1],
          ],
        },
        {
          ...trackErrors,
          primaryKeyValues: [
            [2, '2016-07-01T23:37:02.000Z', 1],
            [3, '2016-07-01T23:37:03.000Z', 1],
          ],
        },
        {
          ...trackErrors,
          primaryKeyValues: [[4, '2016-07-01T23:37:04.000Z', 1]],
        },
      ];

      await enqueueTablesForDeletion(
        { ...base, traceId: 'abc-def' },
        savedItemService,
        '123',
        tableNames,
      );

      expect(sqsSendMock.callCount).toEqual(expectedMessages.length);
      const actualMessages = sqsSendMock.getCalls().map((call) => {
        return JSON.parse(call.args[0].input.Entries[0].MessageBody);
      });
      for (let i = 0; i < expectedMessages.length; i++) {
        // Stupid timezone
        expect(actualMessages[i]).toMatchObject(expectedMessages[i]);
        expect(actualMessages[i].traceId).not.toBeNull;
      }
    });
  });
});
