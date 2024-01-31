import { expect } from 'chai';
import {
  seedDb,
  getArrayOfIds,
  seedItemWithDifferentResolvedId,
} from '../test/_support/seeder';
import { MysqlDataSource } from './MysqlDataSource';
import { primaryPool } from '../test/_support/mysql';
import { RowDataPacket } from 'mysql2';

describe('MysqlDataSource', () => {
  describe('getPremiumUserIds', () => {
    it('should return all premium user id and no non-premium user ids', async () => {
      await seedDb({
        userCount: 100,
        truncate: true,
        listCount: 0,
        tagCount: 0,
      });

      // get total users
      const [total] = await primaryPool.query(
        'SELECT COUNT(user_id) AS total FROM users'
      );

      // get premium users
      const [premium] = await primaryPool.query(
        'SELECT COUNT(user_id) AS total FROM users WHERE premium_status = 1'
      );

      // get non-premium users
      const [nonPremium] = await primaryPool.query(
        'SELECT COUNT(user_id) AS total FROM users WHERE premium_status = 0'
      );

      // make sure total matches how many we seeded
      expect(total[0].total).to.equal(100);

      // make sure they add up to the total
      expect(premium[0].total + nonPremium[0].total).to.equal(100);

      const dataSource = new MysqlDataSource();
      const premiumUserIds = await dataSource.getPremiumUserIds();

      expect(premium[0].total).to.equal(premiumUserIds.length);

      // verify order of user_ids from newest activity to oldest
      const usersMostRecent: { [key: string]: number } = {};
      const [mostRecentActivityLog] = await primaryPool.query<RowDataPacket[]>(
        'SELECT user_id, time_added FROM user_recent_search GROUP BY user_id ORDER BY time_added DESC'
      );
      for (const userActivity of mostRecentActivityLog) {
        usersMostRecent[userActivity.user_id] = userActivity.time_added;
      }

      const firstUserId = premiumUserIds.shift();
      const lastUserId = premiumUserIds.pop();
      expect(usersMostRecent[firstUserId]).to.be.greaterThan(
        usersMostRecent[lastUserId] ?? 0
      );
    }, 15000);
  });

  describe('getItems', () => {
    it('should return all item content', async () => {
      await seedDb({
        listCount: 20,
        userCount: 0,
        tagCount: 0,
        truncate: true,
      });

      const dataSource = new MysqlDataSource();
      const items = await dataSource.getItems(getArrayOfIds(20));

      const itemValues = Object.values(items);

      expect(itemValues.length).to.equal(20);

      itemValues.forEach((item) => {
        expect(item.content).to.contain('string:');
      });
    }, 50000);

    it('should correctly map item_id to resolved_id and then back again', async () => {
      await seedDb({
        listCount: 1,
        userCount: 0,
        tagCount: 0,
        truncate: true,
      });

      await seedItemWithDifferentResolvedId(5, 1);

      const dataSource = new MysqlDataSource();
      const items = await dataSource.getItems([5]);
      expect(items['5'].content).to.contain('string:');
    }, 50000);
  });
});
