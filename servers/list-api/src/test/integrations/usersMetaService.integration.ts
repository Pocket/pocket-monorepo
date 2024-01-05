import { readClient, writeClient } from '../../database/client';
import chai, { expect } from 'chai';
import { UsersMetaService } from '../../dataService';
import { ContextManager } from '../../server/context';
import chaiDateTime from 'chai-datetime';
import { mysqlTimeString } from '../../dataService/utils';
import config from '../../config';

chai.use(chaiDateTime);

describe('UsersMetaService ', () => {
  const writeDb = writeClient();
  const readDb = readClient();
  const context = new ContextManager({
    request: {
      headers: {
        userid: '1',
        apiid: '0',
      },
    },
    dbClient: readDb,
    eventEmitter: null,
  });
  const currentTime = new Date();
  const usersMetaService = new UsersMetaService(context);

  beforeEach(async () => {
    await writeDb('users_meta').truncate();
  });

  afterAll(async () => {
    await readDb.destroy();
    await writeDb.destroy();
  });

  it('inserts a record for tags and deletes old record', async () => {
    await writeDb('users_meta').insert({
      user_id: 1,
      property: 18,
      value: '2019-02-02 00:00:00',
      time_updated: '2019-02-02 00:00:00',
    });
    await writeDb.transaction(async (trx) => {
      await usersMetaService.logTagMutation(currentTime, trx);
    });
    const res = await readDb('users_meta')
      .select()
      .where({ user_id: 1, property: 18 });
    expect(res.length).to.equal(1);
    expect(res[0].property).to.equal(18);
    expect(res[0].value).to.equal(
      mysqlTimeString(currentTime, config.database.tz),
    );
    expect(res[0].time_updated).to.be.closeToTime(currentTime, 1); // mySQL isn't storing milliseconds
  });
});
